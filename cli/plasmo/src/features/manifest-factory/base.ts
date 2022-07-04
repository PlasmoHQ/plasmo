import { copy, pathExists, readJson, writeJson } from "fs-extra"
import createHasher from "node-object-hash"
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  join,
  parse,
  relative,
  resolve
} from "path"
import glob from "tiny-glob"

import type {
  ExtensionManifest,
  ExtensionManifestV2,
  ManifestContentScript,
  ManifestPermission
} from "@plasmo/constants"
import { vLog } from "@plasmo/utils"

import type { CommonPath } from "~features/extension-devtools/common-path"
import { extractContentScriptMetadata } from "~features/extension-devtools/content-script"
import {
  EnvConfig,
  loadEnvConfig
} from "~features/extension-devtools/load-env-config"
import type { PackageJSON } from "~features/extension-devtools/package-file"
import {
  createContentScriptMount,
  createTemplateFiles
} from "~features/extension-devtools/scaffolds"
import {
  TemplatePath,
  getTemplatePath
} from "~features/extension-devtools/template-path"
import { definedTraverse } from "~features/helpers/traverse"

export const autoPermissionList: ManifestPermission[] = ["storage"]

export abstract class BaseFactory<
  T extends ExtensionManifest | ExtensionManifestV2 = any
> {
  envConfig: EnvConfig
  commonPath: CommonPath
  templatePath: TemplatePath

  #hasher = createHasher({ trim: true, sort: true })

  #hash: string
  #prevHash: string

  protected data: Partial<T>
  protected overideManifest: Partial<T> = {}

  protected packageData: PackageJSON
  protected contentScriptMap: Map<string, ManifestContentScript> = new Map()

  get changed() {
    return this.#hash !== this.#prevHash
  }

  get name() {
    return this.packageData.displayName
  }

  constructor(commonPath: CommonPath) {
    this.commonPath = commonPath
    this.templatePath = getTemplatePath()
    this.data = {}
    this.data.icons = {
      "16": "./gen-assets/icon16.png",
      "48": "./gen-assets/icon48.png",
      "128": "./gen-assets/icon128.png"
    }
  }

  async updateEnv() {
    this.envConfig = await loadEnvConfig(this.commonPath.currentDirectory)
  }

  async updatePackageData() {
    this.packageData = await readJson(this.commonPath.packageFilePath)

    this.data.version = this.packageData.version
    this.data.name = this.packageData.displayName
    this.data.description = this.packageData.description
    this.data.author = this.packageData.author

    if (this.packageData.homepage) {
      this.data.homepage_url = this.packageData.homepage
    }

    this.data.permissions = autoPermissionList.filter(
      (p) => `@plasmohq/${p}` in this.packageData.dependencies
    )

    if (this.data.permissions.length === 0) {
      delete this.data.permissions
    }

    this.overideManifest = await this.#getOverrideManifest()
  }

  createOptionsScaffolds = () => createTemplateFiles(this, "options")

  createPopupScaffolds = () => createTemplateFiles(this, "popup")

  createDevtoolsScaffolds = () => createTemplateFiles(this, "devtools")

  createNewtabScaffolds = () => createTemplateFiles(this, "newtab")

  abstract togglePopup: (enable?: boolean) => this
  abstract toggleBackground: (path: string, enable?: boolean) => this

  toggleOptions = (enable = false) => {
    if (enable) {
      this.data.options_ui = {
        page: "./static/options/index.html",
        open_in_tab: true
      }
    } else {
      delete this.data.options_ui
    }
    return this
  }

  toggleOverrides = (
    page: keyof ExtensionManifest["chrome_url_overrides"],
    enable = false
  ) => {
    if (enable) {
      this.data.chrome_url_overrides = {
        ...this.data.chrome_url_overrides,
        [page]: "./static/newtab/index.html"
      }
    } else {
      delete this.data.chrome_url_overrides?.[page]
    }
    return this
  }

  toggleNewtab = (enable = false) => this.toggleOverrides("newtab", enable)

  toggleDevtools = (enable = false) => {
    if (enable) {
      this.data.devtools_page = "./static/devtools/index.html"
    } else {
      delete this.data.devtools_page
    }
    return this
  }

  #contentScriptExt = new Set([".tsx", ".ts"])
  toggleContentScript = async (path: string, enable = false) => {
    const ext = extname(path)

    if (!this.#contentScriptExt.has(ext)) {
      return
    }

    if (enable) {
      const metadata = await extractContentScriptMetadata(path)

      vLog("Adding content script: ", path)

      let manifestScriptPath = relative(
        this.commonPath.dotPlasmoDirectory,
        path
      )

      if (extname(manifestScriptPath) === ".tsx") {
        // copy the contents and change the manifest path
        const modulePath = join("lab", manifestScriptPath).replace(
          /(^src)[\\/]/,
          ""
        )

        const parsedModulePath = parse(modulePath)
        await createContentScriptMount(this, parsedModulePath)
        manifestScriptPath = join("static", modulePath)
      }

      // Resolve css file paths
      if (!!metadata?.config?.css && metadata.config.css.length > 0) {
        metadata.config.css = metadata.config.css.map((cssFile) =>
          relative(
            this.commonPath.dotPlasmoDirectory,
            resolve(dirname(path), cssFile)
          )
        )
      }

      const contentScript = this.injectEnv({
        matches: ["<all_urls>"],
        js: [manifestScriptPath],
        ...(metadata?.config || {})
      })

      this.contentScriptMap.set(path, contentScript)
    } else {
      this.contentScriptMap.delete(path)
    }

    return this
  }

  write = (force = false) => {
    this.#prevHash = this.#hash

    const newManifest = this.toJSON()

    this.#hash = this.#hasher.hash(newManifest)

    if (!this.changed && !force) {
      return
    }
    vLog("Hash changed, updating manifest")
    return writeJson(this.commonPath.entryManifestPath, newManifest, {
      spaces: 2
    })
  }

  toJSON = () => {
    const base = {
      ...this.data
    }

    // Populate content_scripts
    if (this.contentScriptMap.size > 0) {
      base.content_scripts = Array.from(this.contentScriptMap.values())
    }

    const { options_ui, permissions, ...overide } = this.overideManifest

    if (typeof options_ui?.open_in_tab === "boolean" && base.options_ui?.page) {
      base.options_ui.open_in_tab = options_ui.open_in_tab
    }

    base.permissions = [...(base.permissions || []), ...(permissions || [])]

    return {
      ...base,
      ...overide
    }
  }

  #getOverrideManifest = async (): Promise<Partial<T>> => {
    if (!this.packageData?.manifest) {
      return {}
    }

    const output = this.injectEnv<ExtensionManifest, T>(
      this.packageData.manifest
    )

    if (output.web_accessible_resources?.length > 0) {
      output.web_accessible_resources = await this.resolveWAR(
        output.web_accessible_resources as any
      )
    }

    return output
  }

  protected abstract resolveWAR: (
    war: ExtensionManifest["web_accessible_resources"]
  ) => Promise<T["web_accessible_resources"]>

  protected copyProjectFile = async (
    inputFilePath: string
  ): Promise<string | string[]> => {
    try {
      if (inputFilePath.startsWith("~")) {
        return this.copyProjectFile(inputFilePath.slice(1))
      }

      if (inputFilePath.includes("*")) {
        // Handling glob...
        const files = await glob(inputFilePath, {
          cwd: this.commonPath.currentDirectory,
          filesOnly: true
        })

        const filePaths = await Promise.all(files.map(this.copyProjectFile))
        return filePaths.flat()
      }

      const resourceFilePath = isAbsolute(inputFilePath)
        ? inputFilePath
        : resolve(this.commonPath.currentDirectory, inputFilePath)

      if (!pathExists(resourceFilePath)) {
        return inputFilePath
      }

      const destination = resolve(
        this.commonPath.dotPlasmoDirectory,
        inputFilePath
      )

      await copy(resourceFilePath, destination)

      return inputFilePath
    } catch {
      return null
    }
  }

  protected copyNodeModuleFile = async (inputFilePath: string) => {
    try {
      const resourceFilePath = require.resolve(inputFilePath, {
        paths: [this.commonPath.currentDirectory]
      })

      const fileName = basename(resourceFilePath)

      const destination = resolve(this.commonPath.dotPlasmoDirectory, fileName)

      await copy(resourceFilePath, destination)

      return fileName
    } catch {
      return null
    }
  }

  protected injectEnv = <T = any, O = T>(target: T): O =>
    definedTraverse(target, (value) => {
      if (typeof value !== "string") {
        return value
      }

      if (!!value.match(/^\$(\w+)$/)) {
        return this.envConfig.combinedEnv[value.substring(1)] || undefined
      } else {
        return value.replace(
          /\$(\w+)/gm,
          (envKey) => this.envConfig.combinedEnv[envKey.substring(1)] || envKey
        )
      }
    })
}
