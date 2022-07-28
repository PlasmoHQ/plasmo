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

  #mountExt: ScaffolderMountExt
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

    const staticModulePath = resolve(
      this.#plasmoManifest.commonPath.staticDirectory,
      uiPageName
    )
    // Generate the static diretory
    await ensureDir(staticModulePath)

    const hasIndex = indexFile !== undefined

    // console.log({ indexFile, hasIndex })

    const indexImport = hasIndex
      ? toPosix(relative(staticModulePath, indexFile))
      : `~${uiPageName}`

    await Promise.all([
      this.#mirrorGenerate(`index${this.#mountExt}`, staticModulePath, {
        __plasmo_import_module__: indexImport
      }),
      this.createPageHtml(uiPageName, htmlFile, staticModulePath)
    ])

    return hasIndex
  }

  createPageHtml = async (
    uiPageName: ExtensionUIPage,
    htmlFile = "",
    _staticModulePath = ""
  ) => {
    const staticModulePath =
      _staticModulePath ||
      resolve(this.#plasmoManifest.commonPath.staticDirectory, uiPageName)

    const templateReplace = {
      __plasmo_static_index_title__: this.#plasmoManifest.name
    }

    return htmlFile
      ? this.#copyGenerate(htmlFile, resolve(staticModulePath, "index.html"), {
          ...templateReplace,
          "</body>": `<div id="root"></div><script src="./index${
            this.#mountExt
          }" type="module"></script></body>`
        })
      : this.#mirrorGenerate("index.html", staticModulePath, templateReplace)
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
