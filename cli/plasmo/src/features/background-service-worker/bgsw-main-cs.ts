import { camelCase } from "change-case"

import type { ManifestContentScript } from "@plasmo/constants/manifest/content-script"

export const createMainWorldInjector = async (
  scripts: ManifestContentScript[]
) => {
  const mainWorldScripts = scripts.filter((s) => s.world === "MAIN")

  const importStatements = mainWorldScripts.map((s) => {
    const importMetadata = s.js.map((jsPath) => {
      const importName = camelCase(jsPath)
      const importPath = `url:${jsPath}`

      return {
        importName,
        importPath
      }
    })

    const topImport = importMetadata
      .map((i) => `import ${i.importName} from "${i.importPath}"`)
      .join("\n")

    const regCsScript = JSON.stringify({
      ...s,
      js: importMetadata.map((i) => i.importName)
    })

    return [topImport, regCsScript] as const
  })

  return `
${importStatements.map(([top]) => top).join("\n")}

chrome.scripting.registerContentScripts([
  ${importStatements.map(([, reg]) => reg).join(",\n  ")}
])`
}
