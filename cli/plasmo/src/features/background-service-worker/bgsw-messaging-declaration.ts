import { outputFile } from "fs-extra"
import { resolve } from "path"

import type { CommonPath } from "~features/extension-devtools/common-path"
import { addDeclarationConfig } from "~features/helpers/tsconfig"

export const MESSAGING_DECLARATION_FILENAME = `messaging.d.ts`
const MESSAGING_DECLARATION_FILEPATH = `.plasmo/${MESSAGING_DECLARATION_FILENAME}`

export const addMessagingDeclaration = (
  commonPath: CommonPath,
  declarationCode: string
) =>
  Promise.all([
    outputFile(
      resolve(commonPath.dotPlasmoDirectory, MESSAGING_DECLARATION_FILENAME),
      declarationCode
    ),
    addDeclarationConfig(commonPath, MESSAGING_DECLARATION_FILEPATH)
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
