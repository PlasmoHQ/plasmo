import { outputFile, outputJson } from "fs-extra"
import { readFile } from "fs/promises"
import json5 from "json5"
import { resolve } from "path"

import type { CommonPath } from "~features/extension-devtools/common-path"

export const MESSAGING_DECLARATION_FILENAME = `messaging.d.ts`
const MESSAGING_DECLARATION_FILEPATH = `.plasmo/${MESSAGING_DECLARATION_FILENAME}`

const addMessagingDeclarationConfig = async (commonPath: CommonPath) => {
  const tsconfigFilePath = resolve(commonPath.projectDirectory, "tsconfig.json")

  const tsconfigFile = await readFile(tsconfigFilePath, "utf8")
  const tsconfig = json5.parse(tsconfigFile)
  const includeSet = new Set(tsconfig.include)

  if (includeSet.has(MESSAGING_DECLARATION_FILEPATH)) {
    return
  }

  tsconfig.include = [MESSAGING_DECLARATION_FILEPATH, ...includeSet]

  await outputJson(tsconfigFilePath, tsconfig, {
    spaces: 2
  })
}

export const addMessagingDeclaration = (
  commonPath: CommonPath,
  declarationCode: string
) =>
  Promise.all([
    outputFile(
      resolve(commonPath.dotPlasmoDirectory, MESSAGING_DECLARATION_FILENAME),
      declarationCode
    ),
    addMessagingDeclarationConfig(commonPath)
  ])

export const createDeclarationCode = (messages: string[], ports: string[]) => `
import "@plasmohq/messaging"

interface MmMetadata {
\t${messages.join("\n\t")}
}

interface MpMetadata {
\t${ports.join("\n\t")}
}

declare module "@plasmohq/messaging/hook" {
  interface MessagesMetadata extends MmMetadata {}
  interface PortsMetadata extends MpMetadata {}
}

declare module "@plasmohq/messaging" {
  interface MessagesMetadata extends MmMetadata {}
  interface PortsMetadata extends MpMetadata {}
}
`
