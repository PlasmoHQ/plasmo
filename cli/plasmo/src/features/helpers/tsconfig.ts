import { outputJson } from "fs-extra"
import { readFile } from "fs/promises"
import json5 from "json5"
import { resolve } from "path"

import type { CommonPath } from "~features/extension-devtools/common-path"

export const addDeclarationConfig = async (
  commonPath: CommonPath,
  filePath: string
) => {
  const tsconfigFilePath = resolve(commonPath.projectDirectory, "tsconfig.json")

  const tsconfigFile = await readFile(tsconfigFilePath, "utf8")
  const tsconfig = json5.parse(tsconfigFile)
  const includeSet = new Set(tsconfig.include)

  if (includeSet.has(filePath)) {
    return
  }

  tsconfig.include = [filePath, ...includeSet]

  await outputJson(tsconfigFilePath, tsconfig, {
    spaces: 2
  })
}
