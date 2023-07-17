import path from "path"
import ThrowableDiagnostic, { getJSONSourceLocation } from "@parcel/diagnostic"

import { getState } from "./state"

export function handleDictionaries() {
  const { program, ptrs, filePath, asset } = getState()
  if (!program.dictionaries) {
    return
  }

  for (const dict in program.dictionaries) {
    const sourceLoc = getJSONSourceLocation(
      ptrs[`/dictionaries/${dict}`],
      "value"
    )
    const loc = {
      filePath,
      ...sourceLoc
    }
    const dictFile = program.dictionaries[dict]

    if (path.extname(dictFile) !== ".dic") {
      throw new ThrowableDiagnostic({
        diagnostic: [
          {
            message: "Invalid Web Extension manifest",
            origin: "@plasmohq/parcel-transformer-manifest",
            codeFrames: [
              {
                filePath,
                codeHighlights: [
                  {
                    ...sourceLoc,
                    message: "Dictionaries must be .dic files"
                  }
                ]
              }
            ]
          }
        ]
      })
    }

    program.dictionaries[dict] = asset.addURLDependency(dictFile, {
      needsStableName: true,
      loc
    })
    asset.addURLDependency(dictFile.slice(0, -4) + ".aff", {
      needsStableName: true,
      loc
    })
  }
}
