import { outputFile } from "fs-extra"
import { resolve } from "path"

import type { PlasmoManifest } from "~features/manifest-factory/base"

export const PROCESS_ENV_DECLARATION = `process.env`
const PROCESS_ENV_DECLARATION_FILENAME = `${PROCESS_ENV_DECLARATION}.d.ts`

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

  await outputFile(
    resolve(commonPath.dotPlasmoDirectory, PROCESS_ENV_DECLARATION_FILENAME),
    createDeclarationCode(envKeys)
  )
}
