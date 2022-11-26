import { camelCase } from "change-case"
import { readJson, writeJson } from "fs-extra"
import { readdir, writeFile } from "fs/promises"
import { resolve } from "path"
import glob from "tiny-glob"

import type { CommonPath } from "~features/extension-devtools/common-path"
import { toPosix } from "~features/helpers/path"
import type { BaseFactory } from "~features/manifest-factory/base"

const MESSAGING_DECLARATION_FILENAME = `messaging.d.ts`
const MESSAGING_DECLARATION_FILEPATH = `.plasmo/${MESSAGING_DECLARATION_FILENAME}`

const createDeclarationCode = (declarations: string[]) => `
import "@plasmohq/messaging"

interface MessagingMetadata {
\t${declarations.join("\n\t")}
}

declare module "@plasmohq/messaging/hook" {
  interface Metadata extends MessagingMetadata {}
}

declare module "@plasmohq/messaging" {
  interface Metadata extends MessagingMetadata {}
}
`

// TODO: cache these?
const createEntryCode = (
  importSection: string,
  switchCaseSection: string
) => `// @ts-nocheck
${importSection}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.name) {
    ${switchCaseSection}
  }

  return true
})
`

const getMessagingEventList = async (plasmoManifest: BaseFactory) => {
  const files = await glob("**/*.ts", {
    cwd: plasmoManifest.projectPath.backgroundMessagesDirectory,
    filesOnly: true
  })

  return files.map((filePath) => {
    const importPath = toPosix(filePath)
    const eventName = importPath.slice(0, -3)
    const importName = camelCase(filePath)

    return {
      importCode: `import { handler as ${importName} } from "~background/messages/${eventName}"`,
      declaration: `"${eventName}" : {}`,
      caseCode: `
case "${eventName}":
  ${importName}(request, sender, sendResponse)
  break
`,
      eventName,
      importName
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

export const createBgswMessaging = async (plasmoManifest: BaseFactory) => {
  try {
    const codeList = await getMessagingEventList(plasmoManifest)

    if (codeList.length === 0) {
      throw new Error("No messaging events found")
    }

    const entryCode = createEntryCode(
      codeList.map((code) => code.importCode).join("\n"),
      codeList.map((code) => code.caseCode).join("\n")
    )

    const declarationCode = createDeclarationCode(
      codeList.map(({ declaration }) => declaration)
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
