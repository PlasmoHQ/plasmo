import { copy, existsSync, pathExists, readJson, writeJson } from "fs-extra"
import { readdir } from "fs/promises"
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
  ExtensionManifestV3,
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
  ProjectPath,
  getProjectPath
} from "~features/extension-devtools/project-path"
import {
  TemplatePath,
  getTemplatePath
} from "~features/extension-devtools/template-path"
import { getSubExt, toPosix } from "~features/helpers/path"
import { definedTraverse } from "~features/helpers/traverse"

import { Scaffolder } from "./scaffolder"
import { SupportedUIExt, UILibrary, getUILibrary } from "./ui-library"

export const iconMap = {
  "16": "./gen-assets/icon16.plasmo.png",
  "32": "./gen-assets/icon32.plasmo.png",
  "48": "./gen-assets/icon48.plasmo.png",
  "64": "./gen-assets/icon64.plasmo.png",
  "128": "./gen-assets/icon128.plasmo.png"
}

export const autoPermissionList: ManifestPermission[] = ["storage"]

export abstract class BaseFactory<T extends ExtensionManifest = any> {
  #browser: string
  get browser() {
    return this.#browser
  }

  envConfig?: EnvConfig
  public get publicEnv() {
    return this.envConfig?.plasmoPublicEnv
  }

  #commonPath: CommonPath
  public get commonPath(): CommonPath {
    return this.#commonPath
  }

  #projectPath!: ProjectPath
  public get projectPath(): ProjectPath {
    return this.#projectPath
  }

  #templatePath: TemplatePath
  public get templatePath(): TemplatePath {
    return this.#templatePath
  }

  #uiExt: SupportedUIExt = null
  #extSet = new Set([".ts"])

  #hasher = createHasher({ trim: true, sort: true })

  #hash: string = ""
  #prevHash: string = ""

  protected data: Partial<T>
  protected overideManifest: Partial<T> = {}

  protected packageData!: PackageJSON
  protected contentScriptMap: Map<string, ManifestContentScript> = new Map()

  protected copyQueue: Array<[string, string]> = []

  #scaffolder: Scaffolder
  get scaffolder() {
    return this.#scaffolder
  }

  get changed() {
    return this.#hash !== this.#prevHash
  }

  get name() {
    return this.packageData.displayName
  }

  get dependencies() {
    return this.packageData.dependencies
  }

  get devDependencies() {
    return this.packageData.devDependencies
  }

  #cachedUILibrary?: UILibrary
  get uiLibrary() {
    return this.#cachedUILibrary
  }

  get staticScaffoldPath() {
    return !!this.uiLibrary
      ? resolve(this.templatePath.staticTemplatePath, this.uiLibrary.path)
      : ""
  }

  protected constructor(commonPath: CommonPath, browser: string) {
    this.#commonPath = commonPath
    this.#browser = browser
    this.#templatePath = getTemplatePath()
    this.data = {}
    this.data.icons = iconMap
    this.#scaffolder = new Scaffolder(this)
  }

  async updateEnv() {
    this.envConfig = await loadEnvConfig(this.commonPath.projectDirectory)
  }

  // https://github.com/PlasmoHQ/plasmo/issues/195
  prefixDev = (s = "") =>
    process.env.NODE_ENV === "development" ? `DEV | ${s}` : s

  async updatePackageData() {
    this.packageData = await readJson(this.commonPath.packageFilePath)
    if (!this.packageData) {
      throw new Error("Invalid package.json")
    }

    this.data.version = this.packageData.version
    this.data.author = this.packageData.author

    this.data.name = this.prefixDev(this.packageData.displayName)

    this.data.description = this.packageData.description

    if (this.packageData.homepage) {
      this.data.homepage_url = this.packageData.homepage
    }

    this.data.permissions = autoPermissionList.filter(
      (p) => `@plasmohq/${p}` in (this.packageData?.dependencies || {})
    )

    if (this.data.permissions.length === 0) {
      delete this.data.permissions
    }

    await Promise.all([
      (this.overideManifest = await this.#getOverrideManifest()),
      await this.#cacheUILibrary()
    ])
  }

  #cacheUILibrary = async () => {
    this.#cachedUILibrary = await getUILibrary(this)
    if (this.#cachedUILibrary) {
      switch (this.#cachedUILibrary.name) {
        case "svelte":
          this.#uiExt = ".svelte"
          this.#scaffolder.mountExt = ".ts"
          break
        case "vue":
          this.#uiExt = ".vue"
          this.#scaffolder.mountExt = ".ts"
          break
        case "react":
        default:
          this.#uiExt = ".tsx"
          this.#scaffolder.mountExt = ".tsx"
          break
      }

      this.#extSet.add(this.#uiExt)
    }

    this.#projectPath = getProjectPath(
      this.commonPath,
      this.#browser,
      this.#uiExt
    )
  }

  abstract togglePopup: (enable?: boolean) => this
  abstract toggleBackground: (path?: string, enable?: boolean) => boolean

  toggleOptions = (enable = false) => {
    if (enable) {
      this.data.options_ui = {
        page: "./options.html",
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
        [page]: `./${page}.html`
      }
    } else {
      delete this.data.chrome_url_overrides?.[page]
    }
    return this
  }

  toggleNewtab = (enable = false) => this.toggleOverrides("newtab", enable)

  toggleDevtools = (enable = false) => {
    if (enable) {
      this.data.devtools_page = "./devtools.html"
    } else {
      delete this.data.devtools_page
    }
    return this
  }

  toggleContentScript = async (path?: string, enable = false) => {
    if (path === undefined) {
      return false
    }

    const ext = extname(path)

    if (!this.#extSet.has(ext)) {
      return false
    }

    const subExt = getSubExt(path)
    // Ignore if path is browser specific and does not match browser
    if (subExt.length > 0 && subExt !== `.${this.#browser}`) {
      return false
    }

    // Ignore if path is browser generic and there is a browser specific path
    if (
      subExt.length === 0 &&
      existsSync(path.replace(ext, `.${this.#browser}${ext}`))
    ) {
      return false
    }

    if (enable) {
      const metadata = await extractContentScriptMetadata(path)

      vLog("Adding content script: ", path)

      let manifestScriptPath = relative(
        this.commonPath.dotPlasmoDirectory,
        path
      )

      if (extname(manifestScriptPath) === this.#uiExt) {
        // copy the contents and change the manifest path
        const modulePath = join("lab", manifestScriptPath).replace(
          /(^src)[\\/]/,
          ""
        )

        const parsedModulePath = parse(modulePath)
        manifestScriptPath = relative(
          this.commonPath.dotPlasmoDirectory,
          await this.#scaffolder.createContentScriptMount(parsedModulePath)
        )

        // vLog(manifestScriptPath)
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
    return enable
  }

  addContentScriptsDirectory = async (contentsDirectory: string) => {
    const hasContentsDirectory = existsSync(contentsDirectory)
    if (!hasContentsDirectory) {
      return false
    }

    return readdir(contentsDirectory, { withFileTypes: true })
      .then((files) =>
        Promise.all(
          files
            .filter((f) => f.isFile())
            .map((f) => resolve(contentsDirectory, f.name))
            .map((filePath) => this.toggleContentScript(filePath, true))
        )
      )
      .then((results) => results.includes(true))
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

    const { options_ui, permissions, content_scripts, ...overide } =
      this.overideManifest

    if (typeof options_ui?.open_in_tab === "boolean" && base.options_ui?.page) {
      base.options_ui.open_in_tab = options_ui.open_in_tab
    }

    base.permissions = [...(base.permissions || []), ...(permissions || [])]

    // Populate content_scripts
    base.content_scripts = [
      ...Array.from(this.contentScriptMap.values()),
      ...(content_scripts || [])
    ]

    if (base.content_scripts.length === 0) {
      delete base.content_scripts
    }

    return {
      ...base,
      ...overide
    }
  }

  protected abstract prepareOverrideManifest: () =>
    | Promise<Partial<T>>
    | Partial<T>

  #getOverrideManifest = async (): Promise<Partial<T>> => {
    if (!this.packageData?.manifest) {
      return {}
    }

    const output = await this.prepareOverrideManifest()

    if (output.web_accessible_resources?.length > 0) {
      output.web_accessible_resources = await this.resolveWAR(
        this.packageData.manifest.web_accessible_resources
      )
    }

    // Sanitize the BSS
    if (!!output.browser_specific_settings) {
      switch (this.browser) {
        case "edge":
        case "safari":
          output.browser_specific_settings = {
            [this.browser]: output.browser_specific_settings[this.browser]
          }
          break
        case "firefox":
        case "gecko":
          output.browser_specific_settings = {
            gecko: output.browser_specific_settings.gecko
          }
          break
        default:
          delete output.browser_specific_settings
      }
    }

    return this.injectEnv(output)
  }

  async postBuild() {
    await Promise.all(this.copyQueue.map(([src, dest]) => copy(src, dest)))
  }

  protected abstract resolveWAR: (
    war: ExtensionManifestV3["web_accessible_resources"]
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
          cwd: this.commonPath.projectDirectory,
          filesOnly: true
        })

        const filePaths = await Promise.all(files.map(this.copyProjectFile))
        return filePaths.flat()
      }

      const resourceFilePath = isAbsolute(inputFilePath)
        ? inputFilePath
        : resolve(this.commonPath.projectDirectory, inputFilePath)

      if (!pathExists(resourceFilePath)) {
        return inputFilePath
      }

      const destination = resolve(this.commonPath.distDirectory, inputFilePath)

      this.copyQueue.push([resourceFilePath, destination])

      return toPosix(inputFilePath)
    } catch {
      return null
    }
  }

  protected copyNodeModuleFile = async (inputFilePath: string) => {
    try {
      const resourceFilePath = require.resolve(inputFilePath, {
        paths: [this.commonPath.projectDirectory]
      })

      const fileName = basename(resourceFilePath)

      const destination = resolve(this.commonPath.distDirectory, fileName)

      this.copyQueue.push([resourceFilePath, destination])

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
