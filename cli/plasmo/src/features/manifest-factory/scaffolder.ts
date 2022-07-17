import { ensureDir } from "fs-extra"
import { readFile, writeFile } from "fs/promises"
import { ParsedPath, posix, resolve } from "path"

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

  createTemplateFiles = async (moduleFile: string) => {
    vLog(`creating static templates for ${moduleFile}`)

    const staticModulePath = resolve(
      this.#plasmoManifest.commonPath.staticDirectory,
      moduleFile
    )
    // Generate the static diretory
    await ensureDir(staticModulePath)

    return Promise.all([
      this.#generateMirror("index.html", staticModulePath, {
        __plasmo_static_index_title__: this.#plasmoManifest.name
      }),
      this.#generateMirror(`index${this.#mountExt}`, staticModulePath, {
        __plasmo_import_module__: `~${moduleFile}`
      })
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
    await this.#generate(
      `content-script-ui-mount${this.#mountExt}`,
      staticContentPath,
      {
        __plasmo_mount_content_script__: `~${posix.join(
          module.dir,
          module.name
        )}`
      }
    )

    return staticContentPath
  }

  #generate = async (
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

    const finalScaffold = Object.keys(replaceMap).reduce(
      (html, key) => html.replaceAll(key, replaceMap[key]),
      this.#scaffoldCache[fileName]
    )

    await writeFile(outputFilePath, finalScaffold)
  }

  #generateMirror = async (
    fileName: string,
    staticModulePath: string,
    replaceMap: Record<string, string>
  ) => this.#generate(fileName, resolve(staticModulePath, fileName), replaceMap)
}
