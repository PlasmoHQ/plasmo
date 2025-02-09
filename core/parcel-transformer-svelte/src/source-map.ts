/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/HellButcher/parcel-transformer-svelte3-plus
 * Copyright (c) 2023 Christoph Hommelsheim
 * MIT License
 */
import { dirname, isAbsolute, join } from "path"
import SourceMap from "@parcel/source-map"

import type { Options } from "./types"

export function mapSourceMapPath(mapSourceRoot: string, sourcePath: string) {
  if (sourcePath.startsWith("file://")) {
    sourcePath = sourcePath.substring(7)
  }
  if (isAbsolute(sourcePath)) {
    return sourcePath
  } else {
    return join(mapSourceRoot, sourcePath)
  }
}

export function extendSourceMap(
  options: Options,
  filePath: string,
  originalMap: SourceMap,
  sourceMap: any
): SourceMap | null {
  if (!sourceMap) return originalMap
  let mapSourceRoot = dirname(filePath)
  let map = new SourceMap(options.projectRoot)
  map.addVLQMap({
    ...sourceMap,
    sources: sourceMap.sources.map((s) => mapSourceMapPath(mapSourceRoot, s))
  })

  if (originalMap) {
    map.extends(originalMap.toBuffer())
  }
  return map
}
