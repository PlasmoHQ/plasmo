import { existsSync } from "fs"
import { ensureDir } from "fs-extra"
import { readFile, writeFile } from "fs/promises"
import { ParsedPath, join, relative, resolve } from "path"

import { vLog } from "@plasmo/utils"

import { toPosix } from "~features/helpers/path"

import type { BaseFactory } from "./base"

const supportedMountExt = [".ts", ".tsx"] as const

type ExtensionUIPage = "popup" | "options" | "devtools" | "newtab"

export type ScaffolderMountExt = typeof supportedMountExt[number]
export class Scaffolder {
  #scaffoldCache = {} as Record<string, string>
  #plasmoManifest: BaseFactory

  #mountExt: ScaffolderMountExt = ".ts"
  public set mountExt(value: ScaffolderMountExt) {
    this.#mountExt = value
  }

  constructor(plasmoManifest: BaseFactory) {
    this.#plasmoManifest = plasmoManifest
  }

  initTemplateFiles = async (uiPageName: ExtensionUIPage) => {
    vLog(`creating static templates for ${uiPageName}`)

    const indexList = this.#plasmoManifest.projectPath[`${uiPageName}IndexList`]
    const htmlList = this.#plasmoManifest.projectPath[`${uiPageName}HtmlList`]

    const indexFile = indexList.find(existsSync)
    const htmlFile = htmlList.find(existsSync)

    const { staticDirectory } = this.#plasmoManifest.commonPath

    // Generate the static diretory
    await ensureDir(staticDirectory)

    const hasIndex = indexFile !== undefined

    // console.log({ indexFile, hasIndex })

    const indexImport = hasIndex
      ? toPosix(relative(staticDirectory, indexFile))
      : `~${uiPageName}`

    const uiPageModulePath = resolve(
      staticDirectory,
      `${uiPageName}${this.#mountExt}`
    )

    await Promise.all([
      this.#cachedGenerate(`index${this.#mountExt}`, uiPageModulePath, {
        __plasmo_import_module__: indexImport
      }),
      this.createPageHtml(uiPageName, htmlFile)
    ])

    return hasIndex
  }

  generateHtml = async (
    outputPath = "",
    scriptMountPath = "",
    htmlFile = "" as string | false
  ) => {
    const templateReplace = {
      __plasmo_static_index_title__: this.#plasmoManifest.name,
      __plasmo_static_script__: scriptMountPath
    }

    return htmlFile
      ? this.#copyGenerate(htmlFile, outputPath, {
          ...templateReplace,
          "</body>": `<div id="root"></div><script src="${scriptMountPath}" type="module"></script></body>`
        })
      : this.#cachedGenerate("index.html", outputPath, templateReplace)
  }

  createPageHtml = async (
    uiPageName: ExtensionUIPage,
    htmlFile = "" as string | false
  ) => {
    const outputHtmlPath = resolve(
      this.#plasmoManifest.commonPath.dotPlasmoDirectory,
      `${uiPageName}.html`
    )

    const scriptMountPath = `./static/${uiPageName}${this.#mountExt}`

    return this.generateHtml(outputHtmlPath, scriptMountPath, htmlFile)
  }

  createTabMount = async (module: ParsedPath) => {
    vLog(`creating tab mount template for ${module.dir}`)
    const { dotPlasmoDirectory } = this.#plasmoManifest.commonPath

    const staticModulePath = resolve(dotPlasmoDirectory, module.dir)
    await ensureDir(staticModulePath)

    const tabScriptPath = resolve(
      staticModulePath,
      `${module.name}${this.#mountExt}`
    )

    const tabHtmlPath = resolve(staticModulePath, `${module.name}.html`)

    await Promise.all([
      this.#cachedGenerate(`index${this.#mountExt}`, tabScriptPath, {
        __plasmo_import_module__: `~${toPosix(join(module.dir, module.name))}`
      }),
      this.generateHtml(tabHtmlPath, `./${module.name}${this.#mountExt}`)
    ])
  }

  createContentScriptMount = async (module: ParsedPath) => {
    vLog(`creating content script mount for ${module.dir}`)
    const staticModulePath = resolve(
      this.#plasmoManifest.commonPath.staticDirectory,
      module.dir
    )

    await ensureDir(staticModulePath)

    const staticContentPath = resolve(
      staticModulePath,
      `${module.name}${this.#mountExt}`
    )

    // Can pass metadata to check config for type of mount as well?
    await this.#cachedGenerate(
      `content-script-ui-mount${this.#mountExt}`,
      staticContentPath,
      {
        __plasmo_mount_content_script__: `~${toPosix(
          join(module.dir, module.name)
        )}`
      }
    )

    return staticContentPath
  }

  #generate = async (
    templateContent: string,
    outputFilePath: string,
    replaceMap: Record<string, string>
  ) => {
    const finalScaffold = Object.entries(replaceMap).reduce(
      (html, [key, value]) => html.replaceAll(key, value),
      templateContent
    )

    await writeFile(outputFilePath, finalScaffold)
  }

  #copyGenerate = async (
    filePath: string,
    outputFilePath: string,
    replaceMap: Record<string, string>
  ) => {
    const templateContent = await readFile(filePath, "utf8")
    await this.#generate(templateContent, outputFilePath, replaceMap)
  }

  #cachedGenerate = async (
    fileName: string,
    outputFilePath: string,
    replaceMap: Record<string, string>
  ) => {
    if (!this.#scaffoldCache[fileName]) {
      this.#scaffoldCache[fileName] = await readFile(
        resolve(this.#plasmoManifest.staticScaffoldPath, fileName),
        "utf8"
      )
    }

    await this.#generate(
      this.#scaffoldCache[fileName],
      outputFilePath,
      replaceMap
    )
  }

  #mirrorGenerate = async (
    fileName: string,
    staticModulePath: string,
    replaceMap: Record<string, string>
  ) =>
    this.#cachedGenerate(
      fileName,
      resolve(staticModulePath, fileName),
      replaceMap
    )
}
