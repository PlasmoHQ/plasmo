/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/HellButcher/parcel-transformer-svelte3-plus
 * Copyright (c) 2023 Christoph Hommelsheim
 * MIT License
 */
import type { Diagnostic } from "@parcel/diagnostic"
import type SourceMap from "@parcel/source-map"
import type { Warning } from "svelte/types/compiler/interfaces"

import { convertLOC } from "./convert-loc"
import type { MutableAsset } from "./types"

export function convertError(
  asset: MutableAsset,
  originalMap: SourceMap,
  code: string,
  diagnostic: Warning
) {
  let message = diagnostic.message || "Unknown error"
  if (diagnostic.code) {
    message = `${message} (${diagnostic.code})`
  }
  const res: Diagnostic = {
    message
  }
  if (diagnostic.frame) {
    res.hints = [diagnostic.frame]
  }
  if (diagnostic.start !== undefined && diagnostic.end !== undefined) {
    const { start, end } = convertLOC(asset, originalMap, diagnostic)
    res.codeFrames = [
      {
        filePath: asset.filePath,
        code,
        language: "svelte",
        codeHighlights: [
          {
            start,
            end
          }
        ]
      }
    ]
  }

  return res
}
