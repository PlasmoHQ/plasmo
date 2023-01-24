import { outputFile, outputJson } from "fs-extra"
import { readFile } from "fs/promises"
import json5 from "json5"
import { resolve } from "path"

import type { CommonPath } from "~features/extension-devtools/common-path"

const DECLARATION_FILEPATH = `.plasmo/index.d.ts`

const INDEX_DECLARATION = ["process.env", "messaging"]
  .map((e) => `import "./${e}"`)
  .join("\n")

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

export const outputIndexDeclaration = async (commonPath: CommonPath) => {
  const declarationFilePath = resolve(
    commonPath.projectDirectory,
    DECLARATION_FILEPATH
  )

  await Promise.all([
    outputFile(declarationFilePath, INDEX_DECLARATION),
    addDeclarationConfig(commonPath, DECLARATION_FILEPATH)
  ])
}
