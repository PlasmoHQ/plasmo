import { getJSONSourceLocation } from "@parcel/diagnostic"

import { state } from "./state"

export function handleContentScripts() {
  const { program, hot, asset, filePath, ptrs } = state

  if (!program.content_scripts) {
    return
  }

  for (let i = 0; i < program.content_scripts.length; ++i) {
    const sc = program.content_scripts[i]

    for (const k of ["css", "js"]) {
      const assets = sc[k] || []

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

    if (hot && sc.js && sc.js.length) {
      state.needRuntimeBG = true
      sc.js.push(
        asset.addURLDependency("../runtime/auto-reload.js", {
          resolveFrom: __filename
        })
      )
    }
  }
}
