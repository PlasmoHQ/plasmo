import { readJson, writeJson } from "fs-extra"
import createHasher from "node-object-hash"
import { dirname, extname, join, parse, relative, resolve } from "path"
import { valid } from "semver"

import type {
  ExtensionManifest,
  ManifestContentScript,
  ManifestPermission
} from "@plasmo/constants"
import { vLog } from "@plasmo/utils"

import type { CommonPath } from "./common-path"
import { extractContentScriptMetadata } from "./content-script"
import type { PackageJSON } from "./package-file"
import { createContentScriptMount, createTemplateFiles } from "./scaffolds"
import { TemplatePath, getTemplatePath } from "./template-path"

export const autoPermissionList: ManifestPermission[] = ["storage"]

export class PlasmoExtensionManifest {
  commonPath: CommonPath
  templatePath: TemplatePath

  #data: Partial<ExtensionManifest>
  #packageData: PackageJSON

  #hash: string
  #prevHash: string

  #hasher = createHasher({ trim: true, sort: true })

  #contentScriptMap: Map<string, ManifestContentScript> = new Map()

  get changed() {
    return this.#hash !== this.#prevHash
  }

  constructor(commonPath: CommonPath) {
    this.commonPath = commonPath
    this.templatePath = getTemplatePath()
    this.#data = {
      manifest_version: 3,
      icons: {
        "16": "./gen-assets/icon16.png",
        "48": "./gen-assets/icon48.png",
        "128": "./gen-assets/icon128.png"
      },
      action: {
        default_icon: {
          "16": "./gen-assets/icon16.png",
          "48": "./gen-assets/icon48.png"
        }
      }
    }
  }

  async updatePackageData() {
    this.#packageData = await readJson(this.commonPath.packageFilePath)

    this.#data.version = this.#packageData.version
    this.#data.name = this.#packageData.displayName
    this.#data.description = this.#packageData.description
    this.#data.author = this.#packageData.author

    this.#data.permissions = autoPermissionList.filter((p) =>
      valid(this.#packageData.dependencies[`@plasmohq/${p}`])
    )

    if (this.#data.permissions.length === 0) {
      delete this.#data.permissions
    }
  }

  get name() {
    return this.#packageData.displayName
  }

  createOptionsScaffolds = () => createTemplateFiles(this, "options")

  createPopupScaffolds = () => createTemplateFiles(this, "popup")

  createDevtoolsScaffolds = () => createTemplateFiles(this, "devtools")

  toggleOptions = (enable = false) => {
    if (enable) {
      this.#data.options_ui = {
        page: "./static/options/index.html",
        open_in_tab: true
      }
    } else {
      delete this.#data.options_ui
    }
    return this
  }

  togglePopup = (enable = false) => {
    if (enable) {
      this.#data.action.default_popup = "./static/popup/index.html"
    } else {
      delete this.#data.action.default_popup
    }
    return this
  }

  toggleDevtools = (enable = false) => {
    if (enable) {
      this.#data.devtools_page = "./static/devtools/index.html"
    } else {
      delete this.#data.devtools_page
    }
    return this
  }

  toggleBackground = (path: string, enable = false) => {
    if (enable) {
      const scriptPath = relative(this.commonPath.dotPlasmoDirectory, path)
      this.#data.background = {
        service_worker: scriptPath,
        type: "module"
      }
    } else {
      delete this.#data.background
    }

    return this
  }

  toggleContentScript = async (path: string, enable = false) => {
    if (enable) {
      const metadata = await extractContentScriptMetadata(path)

      let manifestScriptPath = relative(
        this.commonPath.dotPlasmoDirectory,
        path
      )

      if (extname(manifestScriptPath) === ".tsx") {
        // copy the contents and change the manifest path
        const modulePath = join("plasmo", manifestScriptPath)
        await createContentScriptMount(this, parse(modulePath))
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

      const contentScript = {
        matches: ["<all_urls>"],
        js: [manifestScriptPath],
        ...(metadata?.config || {})
      }

      this.#contentScriptMap.set(path, contentScript)
    } else {
      this.#contentScriptMap.delete(path)
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
      ...this.#data
    }

    // Populate content_scripts
    if (this.#contentScriptMap.size > 0) {
      base.content_scripts = Array.from(this.#contentScriptMap.values())
    }

    const { options_ui, action, permissions, ...overide } =
      this.#packageData?.manifest || {}

    if (typeof options_ui?.open_in_tab === "boolean" && base.options_ui?.page) {
      base.options_ui.open_in_tab = options_ui.open_in_tab
    }

    base.permissions = [...(base.permissions || []), ...(permissions || [])]

    return {
      ...base,
      ...overide
    }
  }
}
