/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/HellButcher/parcel-transformer-svelte3-plus
 * Copyright (c) 2023 Christoph Hommelsheim
 * MIT License
 */
import type SourceMap from "@parcel/source-map"
import { remapSourceLocation } from "@parcel/utils"
import type { Warning } from "svelte/types/compiler/interfaces"

import type { MutableAsset } from "./types"

export function convertLOC(
  asset: MutableAsset,
  originalMap: SourceMap,
  loc: Warning
) {
  let location = {
    filePath: asset.filePath,
    start: {
      line: loc.start.line + Number(asset.meta.startLine || 1) - 1,
      column: loc.start.column + 1
    },
    end: {
      line: loc.end.line + Number(asset.meta.startLine || 1) - 1,
      column: loc.end.column + 1
    }
  }
  if (originalMap) {
    location = remapSourceLocation(location, originalMap)
  }
  return location
}
