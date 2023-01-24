import { outputFile } from "fs-extra"
import { resolve } from "path"

import type { CommonPath } from "~features/extension-devtools/common-path"

export const MESSAGING_DECLARATION = `messaging` as const

const MESSAGING_DECLARATION_FILENAME = `${MESSAGING_DECLARATION}.d.ts`

export const outputMessagingDeclaration = (
  commonPath: CommonPath,
  declarationCode: string
) =>
  outputFile(
    resolve(commonPath.dotPlasmoDirectory, MESSAGING_DECLARATION_FILENAME),
    declarationCode
  )

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
