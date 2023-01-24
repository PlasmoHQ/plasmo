import { outputFile } from "fs-extra"
import { resolve } from "path"

import { addDeclarationConfig } from "~features/helpers/tsconfig"
import type { PlasmoManifest } from "~features/manifest-factory/base"

const DECLARATION_FILENAME = `process.env.d.ts`

const DECLARATION_FILEPATH = `.plasmo/${DECLARATION_FILENAME}`

const createDeclarationCode = (envKeys: string[]) => `
declare namespace NodeJS {
  interface ProcessEnv {
${envKeys.map((e) => `\t\t${e}?: string`).join("\n")}
  }
}
`

export async function outputEnvDeclaration({
  commonPath,
  publicEnv
}: PlasmoManifest) {
  const envKeys = Object.keys(publicEnv.data)

  if (envKeys.length === 0) {
    return
  }

  await Promise.all([
    outputFile(
      resolve(commonPath.dotPlasmoDirectory, DECLARATION_FILENAME),
      createDeclarationCode(envKeys)
    ),
    addDeclarationConfig(commonPath, DECLARATION_FILEPATH)
  ])
}
