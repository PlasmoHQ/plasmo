import { ok } from "assert"
import { readdir } from "fs/promises"
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
import { cwd } from "process"
import glob from "fast-glob"
import {
  copy,
  ensureDir,
  existsSync,
  pathExists,
  readJson,
  writeJson
} from "fs-extra"
import { hasher as createHasher } from "node-object-hash"

import type {
  ChromeUrlOverrideType,
  ExtensionManifest,
  ExtensionManifestV3,
  ManifestContentScript,
  ManifestPermission
} from "@plasmo/constants"
import {
  buildBroadcast,
  BuildSocketEvent
} from "@plasmo/framework-shared/build-socket"
import { assertTruthy } from "@plasmo/utils/assert"
import { injectEnv } from "@plasmo/utils/env"
import { isDirectory, isReadable } from "@plasmo/utils/fs"
import { vLog, wLog } from "@plasmo/utils/logging"
import { getSubExt, toPosix } from "@plasmo/utils/path"

import { loadEnvConfig, type EnvConfig } from "~features/env/env-config"
import { outputEnvDeclaration } from "~features/env/env-declaration"
import {
  getCommonPath,
  type CommonPath
} from "~features/extension-devtools/common-path"
import { extractContentScriptConfig } from "~features/extension-devtools/content-script-config"
import { generateIcons } from "~features/extension-devtools/generate-icons"
import type { PlasmoBundleConfig } from "~features/extension-devtools/get-bundle-config"
import type { PackageJSON } from "~features/extension-devtools/package-file"
import {
  getProjectPath,
  type ProjectPath
} from "~features/extension-devtools/project-path"
import { getTemplatePath } from "~features/extension-devtools/template-path"
import { outputIndexDeclaration } from "~features/extension-devtools/tsconfig"
import { cleanUpLargeCache } from "~features/extra/cache-busting"
import { updateVersionFile } from "~features/framework-update/version-tracker"
import { definedTraverse } from "~features/helpers/traverse"

import { Scaffolder } from "./scaffolder"
import {
  getUiExtMap,
  getUiLibrary,
  type UiExtMap,
  type UiLibrary
} from "./ui-library"

export const iconMap = {
  "16": "./gen-assets/icon16.plasmo.png",
  "32": "./gen-assets/icon32.plasmo.png",
  "48": "./gen-assets/icon48.plasmo.png",
  "64": "./gen-assets/icon64.plasmo.png",
  "128": "./gen-assets/icon128.plasmo.png"
}

export const autoPermissionList: ManifestPermission[] = ["storage"]

const hasher = createHasher({ trim: true, sort: true })

export abstract class PlasmoManifest<T extends ExtensionManifest = any> {
  get browser() {
    return this.bundleConfig.browser as typeof process.env.PLASMO_BROWSER
  }

  #commonPath?: CommonPath
  public get commonPath() {
    return assertTruthy(this.#commonPath)
  }

  #projectPath?: ProjectPath
  public get projectPath() {
    return assertTruthy(this.#projectPath)
  }

  readonly templatePath = getTemplatePath()

  #envConfig?: EnvConfig

  public get combinedEnv() {
    ok(this.#envConfig)
    return this.#envConfig.combinedEnv
  }

  public get publicEnv() {
    ok(this.#envConfig)
    return this.#envConfig.plasmoPublicEnv
  }

  #extSet = new Set([".ts", ".js"])
  #uiExtSet = new Set()

  #uiLibraryData?: {
    uiLibrary: UiLibrary
    uiExtMap: UiExtMap
  }

  get uiLibrary() {
    ok(this.#uiLibraryData)
    return this.#uiLibraryData.uiLibrary
  }

  get mountExt() {
    ok(this.#uiLibraryData)
    return this.#uiLibraryData.uiExtMap.mountExt
  }

  get uiExts() {
    ok(this.#uiLibraryData)
    return this.#uiLibraryData.uiExtMap.uiExts
  }

  #hash = ""
  #prevHash = ""

  protected data: Partial<T> = {}
  protected overideManifest: Partial<T> = {}

  protected packageData?: PackageJSON

  contentScriptMap: Readonly<Map<string, ManifestContentScript>> = new Map()

  get mainWorldScriptList() {
    const output: ManifestContentScript[] = []
    for (const script of this.contentScriptMap.values()) {
      if (script.world === "MAIN") {
        output.push(script)
      }
    }
    return output
  }

  get hasMainWorldScript() {
    for (const script of this.contentScriptMap.values()) {
      if (script.world === "MAIN") {
        return true
      }
    }
    return false
  }

  readonly copyMap = new Map<string, string>()
  readonly permissionSet = new Set<ManifestPermission>()

  readonly scaffolder: Scaffolder

  get changed() {
    return this.#hash !== this.#prevHash
  }

  get name() {
    ok(this.packageData)
    return this.packageData.displayName
  }

  get dependencies() {
    ok(this.packageData)
    // to support npm workspaces (mono repos) we need to fallback to
    // peerDependencies because dependencies will never exist
    return this.packageData.dependencies ?? this.packageData.peerDependencies
  }

  get devDependencies() {
    ok(this.packageData)
    return this.packageData.devDependencies
  }

  get staticScaffoldPath() {
    ok(this.uiLibrary)
    return resolve(this.templatePath.staticTemplatePath, this.uiLibrary.path)
  }

  protected constructor(public bundleConfig: PlasmoBundleConfig) {
    this.data.icons = iconMap
    this.scaffolder = new Scaffolder(this)
  }

  private async initEnv(envRootDirectory = cwd()) {
    this.#envConfig = await loadEnvConfig(envRootDirectory)
    this.#commonPath = getCommonPath(envRootDirectory)
  }

  async startup() {
    await this.initEnv()

    vLog(`Ensure exists: ${this.commonPath.dotPlasmoDirectory}`)
    await ensureDir(this.commonPath.dotPlasmoDirectory)
    await cleanUpLargeCache(this.commonPath)
    await updateVersionFile(this.commonPath)
    await generateIcons(this.commonPath)

    await outputIndexDeclaration(this.commonPath)
    await this.updateEnv()

    await this.updatePackageData()
  }

  async postBuild() {
    await Promise.all(
      Array.from(this.copyMap, async ([dest, src]) => {
        if (!(await isReadable(dest))) {
          await copy(src, dest)
        }
      })
    )

    if (!process.env.POST_BUILD_SCRIPT) {
      return
    }
    const postBuildPath = resolve(process.env.POST_BUILD_SCRIPT)

    if (!existsSync(postBuildPath)) {
      wLog("Post-build script is unavailable:", postBuildPath)
      return
    }

    const postBuild = require(postBuildPath)
    postBuild()
  }

  async updateEnv() {
    await this.initEnv(this.commonPath.projectDirectory)
    await outputEnvDeclaration(this)
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

    for (const perm of autoPermissionList) {
      if (`@plasmohq/${perm}` in (this.packageData.dependencies || {})) {
        this.permissionSet.add(perm)
      }
    }

    await this.#cacheUiLibrary()

    this.overideManifest = await this.#getOverrideManifest()
  }

  #cacheUiLibrary = async () => {
    const uiLibrary = await getUiLibrary(this)
    const uiExtMap = getUiExtMap(uiLibrary.name)

    this.#uiLibraryData = {
      uiLibrary,
      uiExtMap
    }

    this.#uiExtSet = new Set(uiExtMap.uiExts)
    this.uiExts.forEach((uiExt) => {
      this.#extSet.add(uiExt)
    })

    this.#projectPath = getProjectPath(
      this.commonPath,
      this.browser,
      this.uiExts
    )
  }

  abstract togglePopup: (enable?: boolean) => this
  abstract toggleBackground: (enable?: boolean) => boolean
  abstract toggleSidePanel: (enable?: boolean) => this

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

  toggleOverrides = (page: ChromeUrlOverrideType, enable = false) => {
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

  isPathInvalid = (path?: string): path is undefined => {
    if (path === undefined) {
      return true
    }

    const ext = extname(path)

    if (!this.#extSet.has(ext)) {
      return true
    }

    const subExt = getSubExt(path)
    // Ignore if path is browser specific and does not match browser
    if (subExt.length > 0 && subExt !== `.${this.browser}`) {
      return true
    }

    // Ignore if path is browser generic and there is a browser specific path
    if (
      subExt.length === 0 &&
      existsSync(path.replace(ext, `.${this.browser}${ext}`))
    ) {
      return true
    }

    return false
  }

  toggleContentScript = async (path?: string, enable = false) => {
    if (this.isPathInvalid(path)) {
      return false
    }

    if (enable) {
      const metadata = await extractContentScriptConfig(path)
      if (metadata?.isEmpty) {
        return false
      }

      vLog("Adding content script: ", path)

      let scriptPath = relative(this.commonPath.dotPlasmoDirectory, path)
      const scriptExt = extname(scriptPath)

      const isCsui = this.#uiExtSet.has(scriptExt)

      if (this.uiLibrary?.name !== "vanilla" && isCsui) {
        // copy the contents and change the manifest path
        const modulePath = join("lab", scriptPath).replace(/(^src)[\\/]/, "")

        const parsedModulePath = parse(modulePath)
        scriptPath = relative(
          this.commonPath.dotPlasmoDirectory,
          await this.scaffolder.createContentScriptMount(parsedModulePath)
        )
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

      const contentScript = this.injectEnvToObj({
        matches: ["<all_urls>"],
        js: [
          metadata?.config?.world === "MAIN"
            ? scriptPath.split(scriptExt)[0]
            : scriptPath
        ],
        ...(metadata?.config || {})
      })

      this.contentScriptMap.set(path, contentScript)
    } else {
      this.contentScriptMap.delete(path)
    }

    buildBroadcast(BuildSocketEvent.CsChanged)

    return enable
  }

  addDirectory = async (
    path: string,
    toggleDynamicPath: typeof this.toggleContentScript,
    filterFile?: (fileName: string) => boolean
  ) => {
    if (!existsSync(path)) {
      return false
    }

    return readdir(path, { withFileTypes: true })
      .then((files) =>
        Promise.all(
          files
            .filter((f) =>
              f.isFile() && filterFile ? filterFile(f.name) : true
            )
            .map((f) => resolve(path, f.name))
            .map((filePath) => toggleDynamicPath(filePath, true))
        )
      )
      .then((results) => results.includes(true))
  }

  addContentScriptsIndexFiles = async () => {
    const path = this.projectPath.contentsDirectory
    if (!(await isDirectory(path))) {
      return false
    }

    const indexFileList = [...this.#extSet].flatMap((ext) => [
      `index${ext}`,
      `index.${this.browser}${ext}`
    ])

    return readdir(path, { withFileTypes: true })
      .then((files) =>
        Promise.all(
          files
            .filter((f) => f.isDirectory())
            .map((dir) => resolve(path, dir.name))
            .map((dirPath) =>
              this.addDirectory(dirPath, this.toggleContentScript, (fileName) =>
                indexFileList.includes(fileName)
              )
            )
        )
      )
      .then((results) => results.includes(true))
  }

  addContentScriptsDirectory = async (
    contentsDirectory = this.projectPath.contentsDirectory
  ) =>
    Promise.all([
      this.addDirectory(contentsDirectory, this.toggleContentScript),
      this.addContentScriptsIndexFiles()
    ]).then((results) => results.includes(true))

  togglePage = async (path?: string, enable = false) => {
    if (this.isPathInvalid(path)) {
      return false
    }

    if (enable) {
      const scriptPath = relative(this.commonPath.sourceDirectory, path)

      const parsedModulePath = parse(scriptPath)

      const { wereFilesWritten } =
        await this.scaffolder.createPageMount(parsedModulePath)

      // if enabled, and the template file was written, invalidate hash!
      if (wereFilesWritten) {
        this.#hash = ""
      }
    } else {
      this.#hash = ""
    }

    return enable
  }

  addPagesDirectory = async (directory: string) =>
    this.addDirectory(directory, this.togglePage)

  write = (force = false) => {
    this.#prevHash = this.#hash

    const newManifest = this.toJSON()

    this.#hash = hasher.hash(newManifest)

    if (!this.changed && !force) {
      return
    }
    vLog("Hash changed, updating manifest")
    console.log("Writing new manifest to", this.commonPath.entryManifestPath, newManifest)
    return writeJson(this.commonPath.entryManifestPath, newManifest, {
      spaces: 2
    })
  }

  toJSON = () => {
    const base = {
      ...this.data
    }

    const {
      options_ui: overrideOptionUi,
      permissions: overridePermissions,
      content_scripts: overrideContentScripts,
      background: overrideBackground,
      ...overide
    } = this.overideManifest as T

    if (base.options_ui?.page) {
      base.options_ui = {
        ...base.options_ui,
        ...overrideOptionUi
      }
    }

    base.permissions = [
      ...new Set([...this.permissionSet, ...(overridePermissions || [])])
    ]

    if (base.permissions?.length === 0) {
      delete base.permissions
    }

    if (this.bundleConfig.manifestVersion === "mv2") {
      base.background = {
        ...base.background,
        ...overrideBackground
      }
      if (Object.keys(base.background).length === 0) {
        delete base.background
      }
      // Host permission is coupled with permission in mv2
      if (overide["host_permissions"]?.length > 0) {
        base.permissions = [
          ...(base.permissions || []),
          ...overide["host_permissions"]
        ]
      }
    }

    // Populate content_scripts
    base.content_scripts = [
      ...Array.from(this.contentScriptMap.values()).filter(
        (s) => s.world !== "MAIN" // TODO: Remove this when Chrome natively supports mainworld for CS
      ),
      ...(overrideContentScripts! || [])
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

    let output = await this.prepareOverrideManifest()

    if ((output.web_accessible_resources?.length || 0) > 0) {
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

    if (output.overrides && output.overrides[this.browser]) {
      output = { ...output, ...output.overrides[this.browser] }
    }
    delete output.overrides
    return this.injectEnvToObj(output)
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
          onlyFiles: true
        })

        await Promise.all(files.map(this.copyProjectFile))
        return inputFilePath
      }

      const resourceFilePath = isAbsolute(inputFilePath)
        ? inputFilePath
        : resolve(this.commonPath.projectDirectory, inputFilePath)

      const canCopy =
        !this.projectPath.isEntryPath(resourceFilePath) &&
        (await pathExists(resourceFilePath))

      if (!canCopy) {
        return inputFilePath
      }

      const destination = resolve(this.commonPath.distDirectory, inputFilePath)

      this.copyMap.set(destination, resourceFilePath)

      return toPosix(inputFilePath)
    } catch {
      return inputFilePath
    }
  }

  protected copyNodeModuleFile = async (inputFilePath: string) => {
    try {
      const resourceFilePath = require.resolve(inputFilePath, {
        paths: [this.commonPath.projectDirectory]
      })

      const fileName = basename(resourceFilePath)

      const destination = resolve(this.commonPath.distDirectory, fileName)

      this.copyMap.set(destination, resourceFilePath)

      return fileName
    } catch {
      return null
    }
  }

  protected injectEnvToObj = <T = any, O = T>(target: T): O =>
    definedTraverse(target, (value) => {
      if (typeof value !== "string") {
        return value
      }

      if (!!value.match(/^\$(\w+)$/)) {
        return this.combinedEnv[value.substring(1)] || undefined
      } else {
        return injectEnv(value, this.combinedEnv)
      }
    })
}
