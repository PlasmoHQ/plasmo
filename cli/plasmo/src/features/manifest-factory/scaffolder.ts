import { copy, ensureDir } from "fs-extra"
import { readFile, writeFile } from "fs/promises"
import { type ParsedPath, join, relative, resolve } from "path"

import { find } from "@plasmo/utils/array"
import { isAccessible, isFile } from "@plasmo/utils/fs"
import { vLog } from "@plasmo/utils/logging"
import { toPosix } from "@plasmo/utils/path"

import { getRevHash } from "~features/helpers/crypto"

import { type PlasmoManifest } from "./base"
import { isSupportedUiExt } from "./ui-library"

type ExtensionUIPage = "popup" | "options" | "devtools" | "newtab" | "sidepanel"

export class Scaffolder {
  #templateCache = {} as Record<string, string>
  #outputHashCache = {} as Record<string, string>

  get projectPath() {
    return this.plasmoManifest.projectPath
  }

  get commonPath() {
    return this.plasmoManifest.commonPath
  }

  get mountExt() {
    return this.plasmoManifest.mountExt
  }

  constructor(private plasmoManifest: PlasmoManifest) {}

  async init() {
    const [_, ...uiPagesResult] = await Promise.all([
      this.#copyStaticCommon(),
      this.#initUiPageTemplate("popup"),
      this.#initUiPageTemplate("options"),
      this.#initUiPageTemplate("newtab"),
      this.#initUiPageTemplate("devtools"),
      this.#initUiPageTemplate("sidepanel")
    ])

    return uiPagesResult
  }

  #copyStaticCommon = async () => {
    const templateCommonDirectory = resolve(
      this.plasmoManifest.templatePath.staticTemplatePath,
      "common"
    )

    const staticCommonDirectory = resolve(
      this.commonPath.staticDirectory,
      "common"
    )

    return copy(templateCommonDirectory, staticCommonDirectory)
  }

  #initUiPageTemplate = async (uiPageName: ExtensionUIPage) => {
    vLog(`Creating static templates for ${uiPageName}`)

    const indexList = this.projectPath[`${uiPageName}IndexList`]
    const htmlList = this.projectPath[`${uiPageName}HtmlList`]

    const [indexFile, htmlFile] = await Promise.all(
      [indexList, htmlList].map((l) => find(l, isAccessible))
    )

    const { staticDirectory } = this.commonPath

    // Generate the static diretory
    await ensureDir(staticDirectory)

    const hasIndex = indexFile !== undefined

    // console.log({ indexFile, hasIndex })

    const indexImport = hasIndex
      ? toPosix(relative(staticDirectory, indexFile))
      : `~${uiPageName}`

    const uiPageModulePath = resolve(
      staticDirectory,
      `${uiPageName}${this.mountExt}`
    )

    await Promise.all([
      this.#cachedGenerate(`index${this.mountExt}`, uiPageModulePath, {
        __plasmo_import_module__: indexImport
      }),
      this.createPageHtml(uiPageName, htmlFile)
    ])

    return hasIndex
  }

  generateHtml = async (
    outputPath = "",
    scriptMountPath = "",
    overridePath = ""
  ) => {
    const templateReplace = {
      __plasmo_static_index_title__: this.plasmoManifest.name,
      __plasmo_static_script__: scriptMountPath
    }

    const hasOverride = await isFile(overridePath)

    return hasOverride
      ? this.#copyGenerate(overridePath, outputPath, {
          ...templateReplace,
          "</body>": `<div id="__plasmo"></div><script src="${scriptMountPath}" type="module"></script></body>`
        })
      : this.#cachedGenerate("index.html", outputPath, templateReplace)
  }

  /**
   * @return true if file was written, false if cache hit
   */
  createPageHtml = async (uiPageName: ExtensionUIPage, htmlFile = "") => {
    const outputHtmlPath = resolve(
      this.commonPath.dotPlasmoDirectory,
      `${uiPageName}.html`
    )

    const scriptMountPath = `./static/${uiPageName}${this.mountExt}`

    return this.generateHtml(outputHtmlPath, scriptMountPath, htmlFile)
  }

  createPageMount = async (module: ParsedPath) => {
    vLog(`Creating page mount template for ${module.dir}`)

    const staticModulePath = resolve(
      this.commonPath.dotPlasmoDirectory,
      module.dir
    )
    const htmlPath = resolve(staticModulePath, `${module.name}.html`)

    await ensureDir(staticModulePath)
    const isUiExt = isSupportedUiExt(module.ext)

    const scriptPath = resolve(
      staticModulePath,
      `${module.name}${this.mountExt}`
    )

    const overrideHtmlPath = resolve(
      this.commonPath.sourceDirectory,
      module.dir,
      `${module.name}.html`
    )

    const generateResultList = await Promise.all(
      isUiExt
        ? [
            this.#cachedGenerate(`index${this.mountExt}`, scriptPath, {
              __plasmo_import_module__: `~${toPosix(
                join(module.dir, module.name)
              )}`
            }),
            this.generateHtml(
              htmlPath,
              `./${module.name}${this.mountExt}`,
              overrideHtmlPath
            )
          ]
        : [
            this.generateHtml(
              htmlPath,
              `~${toPosix(join(module.dir, module.name))}${module.ext}`,
              overrideHtmlPath
            )
          ]
    )

    return {
      htmlPath,
      wereFilesWritten: generateResultList.some((r) => r)
    }
  }

  createContentScriptMount = async (module: ParsedPath) => {
    vLog(`Creating content script mount for ${module.dir}`)
    const staticModulePath = resolve(
      this.commonPath.staticDirectory,
      module.dir
    )

    await ensureDir(staticModulePath)

    const staticContentPath = resolve(
      staticModulePath,
      `${module.name}${this.mountExt}`
    )

    // Can pass metadata to check config for type of mount as well?
    await this.#cachedGenerate(
      `content-script-ui-mount${this.mountExt}`,
      staticContentPath,
      {
        __plasmo_mount_content_script__: `~${toPosix(
          join(module.dir, module.name)
        )}`
      }
    )

    return staticContentPath
  }

  /**
   * @return true if file was written, false if cache hit
   */
  #generate = async (
    templateContent: string,
    outputFilePath: string,
    replaceMap: Record<string, string>
  ) => {
    const finalScaffold = Object.entries(replaceMap).reduce(
      (html, [key, value]) => html.replaceAll(key, value),
      templateContent
    )

    const hash = getRevHash(Buffer.from(finalScaffold))
    if (this.#outputHashCache[outputFilePath] === hash) {
      return false
    }

    this.#outputHashCache[outputFilePath] = hash
    await writeFile(outputFilePath, finalScaffold)
    return true
  }

  /**
   * @return true if file was written, false if cache hit
   */
  #copyGenerate = async (
    filePath: string,
    outputFilePath: string,
    replaceMap: Record<string, string>
  ) => {
    const templateContent = await readFile(filePath, "utf8")

    return this.#generate(templateContent, outputFilePath, replaceMap)
  }

  /**
   * @return true if file was written, false if cache hit
   */
  #cachedGenerate = async (
    fileName: string,
    outputFilePath: string,
    replaceMap: Record<string, string>
  ) => {
    this.#templateCache[fileName] ||= await readFile(
      resolve(this.plasmoManifest.staticScaffoldPath, fileName),
      "utf8"
    )

    return this.#generate(
      this.#templateCache[fileName],
      outputFilePath,
      replaceMap
    )
  }
}
