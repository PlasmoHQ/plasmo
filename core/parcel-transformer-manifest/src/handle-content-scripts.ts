import { getJSONSourceLocation } from "@parcel/diagnostic"

import { getState } from "./state"

export function handleContentScripts() {
  const { program, asset, filePath, ptrs } = getState()
  if (!program.content_scripts) {
    return
  }

  for (let i = 0; i < program.content_scripts.length; ++i) {
    const contentScript = program.content_scripts[i]

    for (const k of ["css", "js"]) {
      const assets = contentScript[k] || []

      for (let j = 0; j < assets.length; ++j) {
        assets[j] = asset.addURLDependency(assets[j], {
          bundleBehavior: "isolated",
          loc: {
            filePath,
            ...getJSONSourceLocation(
              ptrs[`/content_scripts/${i}/${k}/${j}`],
              "value"
            )
          }
        })
      }
    }
  }
}
