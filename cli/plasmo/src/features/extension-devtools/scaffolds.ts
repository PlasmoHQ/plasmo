import { ensureDir } from "fs-extra"
import { readFile, writeFile } from "fs/promises"
import { ParsedPath, posix, resolve } from "path"

import { vLog } from "@plasmo/utils"

import type { BaseFactory } from "../manifest-factory/base"
import { getTemplatePath } from "./template-path"

const { staticTemplatePath } = getTemplatePath()

const scaffoldCache = {} as Record<string, string>

const generateScaffold = async (
  fileName: string,
  outputFilePath: string,
  replaceMap: Record<string, string>
) => {
  if (!scaffoldCache[fileName]) {
    scaffoldCache[fileName] = await readFile(
      resolve(staticTemplatePath, fileName),
      "utf8"
    )
  }

  const finalScaffold = Object.keys(replaceMap).reduce(
    (html, key) => html.replaceAll(key, replaceMap[key]),
    scaffoldCache[fileName]
  )

  await writeFile(outputFilePath, finalScaffold)
}

const generateMirrorScaffold = async (
  fileName: string,
  staticModulePath: string,
  replaceMap: Record<string, string>
) => generateScaffold(fileName, resolve(staticModulePath, fileName), replaceMap)

export async function createTemplateFiles(
  plasmoManifest: BaseFactory,
  moduleFile: string
) {
  vLog(`creating static templates for ${moduleFile}`)

  const staticModulePath = resolve(
    plasmoManifest.commonPath.staticDirectory,
    moduleFile
  )
  // Generate the static diretory
  await ensureDir(staticModulePath)

  return Promise.all([
    generateMirrorScaffold("index.html", staticModulePath, {
      __plasmo_static_index_title__: plasmoManifest.name
    }),
    generateMirrorScaffold("index.tsx", staticModulePath, {
      __plasmo_import_module__: `~${moduleFile}`
    })
  ])
}

export async function createContentScriptMount(
  plasmoManifest: BaseFactory,
  module: ParsedPath
) {
  const staticModulePath = resolve(
    plasmoManifest.commonPath.staticDirectory,
    module.dir
  )

  await ensureDir(staticModulePath)

  const staticContentPath = resolve(staticModulePath, module.base)

  // Can pass metadata to check config for type of mount as well?
  return generateScaffold("content-script-ui-mount.tsx", staticContentPath, {
    __plasmo_mount_content_script__: `~${posix.join(module.dir, module.name)}`
  })
}
