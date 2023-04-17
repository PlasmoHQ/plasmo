import { camelCase } from "change-case"
import { outputFile } from "fs-extra"
import { relative, resolve } from "path"

import { vLog } from "@plasmo/utils/logging"
import { toPosix } from "@plasmo/utils/path"

import { type PlasmoManifest } from "~features/manifest-factory/base"

export const createBgswMainWorldInjector = async (
  plasmoManifest: PlasmoManifest
) => {
  try {
    const outputPath = resolve(
      plasmoManifest.commonPath.staticDirectory,
      "background",
      "main-world-scripts.ts"
    )

    const importStatements = plasmoManifest.mainWorldScriptList.map((s) => {
      const importMetadata = s.js.map((jsPath) => {
        const importName = camelCase(jsPath)
        const importPath = `url:${toPosix(
          relative(plasmoManifest.commonPath.entryManifestPath, jsPath)
        )}`

        return {
          importName,
          importPath
        }
      })

      const topImport = importMetadata
        .map((i) => `import ${i.importName} from "${i.importPath}"`)
        .join("\n")

      const importScript = importMetadata.map((i) => i.importName)

      const regCsScript = Object.entries(s).reduce(
        (out, [k, v]) => {
          if (k !== "js") {
            out[camelCase(k)] = v
          }
          return out
        },
        { id: importScript.join("-"), js: [] }
      )

      const regCsScriptCode = JSON.stringify(regCsScript).replace(
        /"js":\[\]/,
        `"js":[${importScript
          .map((imSrc) => `${imSrc}.split("/").pop().split("?")[0]`)
          .join(",")}]`
      )

      return [topImport, regCsScriptCode] as const
    })

    if (importStatements.length === 0) {
      return false
    }

    plasmoManifest.permissionSet.add("scripting")

    const code = `${importStatements.map(([top]) => top).join("\n")}
chrome.scripting.registerContentScripts([
  ${importStatements.map(([, reg]) => reg).join(",\n  ")}
])
`

    await outputFile(outputPath, code)

    return true
  } catch (e) {
    vLog(e.message)
    return false
  }
}
