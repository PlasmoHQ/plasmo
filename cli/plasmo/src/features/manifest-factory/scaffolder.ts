import { ensureDir } from "fs-extra"
import { readFile, writeFile } from "fs/promises"
import { ParsedPath, join, posix, resolve } from "path"

import { vLog } from "@plasmo/utils"

import type { BaseFactory } from "./base"

const supportedMountExt = [".ts", ".tsx"] as const

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

  createTemplateFiles = async (
    moduleName: "popup" | "options" | "devtools" | "newtab",
    htmlFile = ""
  ) => {
    vLog(`creating static templates for ${moduleName}`)

    const staticModulePath = resolve(
      this.#plasmoManifest.commonPath.staticDirectory,
      moduleName
    )
    // Generate the static diretory
    await ensureDir(staticModulePath)

    const templateReplace = {
      __plasmo_static_index_title__: this.#plasmoManifest.name
    }

    return Promise.all([
      this.#mirrorGenerate(`index${this.#mountExt}`, staticModulePath, {
        __plasmo_import_module__: `~${moduleName}`
      }),
      htmlFile
        ? this.#copyGenerate(
            htmlFile,
            resolve(staticModulePath, "index.html"),
            {
              ...templateReplace,
              "</body>": `<div id="root"></div><script src="./index${this.mountExt}" type="module"></script></body>`
            }
          )
        : this.#mirrorGenerate("index.html", staticModulePath, templateReplace)
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
        __plasmo_mount_content_script__: `~${posix.normalize(
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
    const finalScaffold = Object.keys(replaceMap).reduce(
      (html, key) => html.replaceAll(key, replaceMap[key]),
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
