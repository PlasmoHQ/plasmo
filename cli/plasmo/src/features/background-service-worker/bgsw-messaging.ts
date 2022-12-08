import { camelCase } from "change-case"
import { existsSync } from "fs"
import { readJson, writeJson } from "fs-extra"
import { readdir, writeFile } from "fs/promises"
import { join, resolve } from "path"
import glob from "tiny-glob"

import { wLog } from "@plasmo/utils/logging"

import type { CommonPath } from "~features/extension-devtools/common-path"
import { getMd5RevHash } from "~features/helpers/crypto"
import { toPosix } from "~features/helpers/path"
import type { BaseFactory } from "~features/manifest-factory/base"

const MESSAGING_DECLARATION_FILENAME = `messaging.d.ts`
const MESSAGING_DECLARATION_FILEPATH = `.plasmo/${MESSAGING_DECLARATION_FILENAME}`

const state = {
  md5Hash: ""
}

const createDeclarationCode = (messages: string[], ports: string[]) => `
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
  interface MessagesMetadata extends MessagingMessagesMetadata {}
  interface PortsMetadata extends MpMetadata {}
}
`

// TODO: cache these?
const createEntryCode = (
  importSection: string,
  switchCaseSection: string,
  portSection: string
) => `// @ts-nocheck
globalThis.__plasmoInternalPortMap = new Map()

${importSection}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.name) {
    ${switchCaseSection}
    default:
      break
  }

  return true
})

${portSection}
`

const getHandlerList = async (
  plasmoManifest: BaseFactory,
  dirName: "messages" | "ports"
) => {
  const handlerDir = join(
    plasmoManifest.projectPath.backgroundDirectory,
    dirName
  )

  const handlerFileList = await glob("**/*.ts", {
    cwd: handlerDir,
    filesOnly: true
  })

  return handlerFileList.map((filePath) => {
    const posixFilePath = toPosix(filePath)
    const handlerName = posixFilePath.slice(0, -3)
    const importPath = `${dirName}/${handlerName}`
    const importName = camelCase(importPath)

    return {
      importName,
      name: handlerName,
      declaration: `"${handlerName}" : {}`,
      importCode: `import { handler as ${importName} } from "~background/${importPath}"`
    }
  })
}

const addMessagingDeclaration = async (commonPath: CommonPath) => {
  const tsconfigFilePath = resolve(commonPath.projectDirectory, "tsconfig.json")

  const tsconfig = await readJson(tsconfigFilePath)
  const includeSet = new Set(tsconfig.include)

  if (includeSet.has(MESSAGING_DECLARATION_FILEPATH)) {
    return
  }

  tsconfig.include = [MESSAGING_DECLARATION_FILEPATH, ...includeSet]

  await writeJson(tsconfigFilePath, tsconfig, { spaces: 2 })
}

const getCaseCode = (
  caseName: string,
  importName: string
) => `case "${caseName}":
  ${importName}(request, ({
    sender,
    send: sendResponse,
  }))
  break`

const getPortCode = (portName: string, importName: string) =>
  `const ${importName}Port = chrome.runtime.connect({ name: "${portName}" })
${importName}Port.onMessage.addListener((message) => {
  ${importName}(message, ({
    port: ${importName}Port,
    send: (response) => {
      ${importName}Port.postMessage(response)
    },
  }))
})`

export const createBgswMessaging = async (plasmoManifest: BaseFactory) => {
  try {
    // check if package.json has messaging API
    if (!("@plasmohq/messaging" in plasmoManifest.dependencies)) {
      wLog("@plasmohq/messaging is not installed, skipping messaging API")
      return
    }

    const [messageHandlerList, portHandlerList] = await Promise.all([
      getHandlerList(plasmoManifest, "messages"),
      getHandlerList(plasmoManifest, "ports")
    ])

    if (messageHandlerList.length === 0 && portHandlerList.length === 0) {
      return false
    }

    const declarationCode = createDeclarationCode(
      messageHandlerList.map(({ declaration }) => declaration),
      portHandlerList.map(({ declaration }) => declaration)
    )

    const declarationMd5Hash = getMd5RevHash(Buffer.from(declarationCode))

    if (state.md5Hash === declarationMd5Hash) {
      return true
    }

    state.md5Hash = declarationMd5Hash

    const entryCode = createEntryCode(
      [...messageHandlerList, ...portHandlerList]
        .map((code) => code.importCode)
        .join("\n"),
      messageHandlerList
        .map((code) => getCaseCode(code.name, code.importName))
        .join("\n"),
      portHandlerList
        .map((code) => getPortCode(code.name, code.importName))
        .join("\n")
    )

    await Promise.all([
      writeFile(
        resolve(
          plasmoManifest.commonPath.staticDirectory,
          "background",
          "messaging.ts"
        ),
        entryCode
      ),
      writeFile(
        resolve(
          plasmoManifest.commonPath.dotPlasmoDirectory,
          MESSAGING_DECLARATION_FILENAME
        ),
        declarationCode
      ),
      addMessagingDeclaration(plasmoManifest.commonPath)
    ])

    return true
  } catch {
    return false
  }
}
