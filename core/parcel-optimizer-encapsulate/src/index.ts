/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 */

import { Optimizer } from "@parcel/plugin"
import SourceMap from "@parcel/source-map"
import type { PluginOptions } from "@parcel/types"

import { vLog } from "@plasmo/utils/logging"

const encapsulateGlobal = (name: string) =>
  `var __${name}; typeof ${name} === "function" && (__${name}=${name},${name}=null);`

const problematicGlobals = ["define"]

const beforeContent = `(function(${problematicGlobals.join(
  ","
)}){${problematicGlobals.map(encapsulateGlobal).join("")}`

const afterContent = ` ${problematicGlobals
  .map((n) => `globalThis.${n}=__${n};`)
  .join("")}  })(${problematicGlobals
  .map((n) => `globalThis.${n}`)
  .join(",")});`

function getSourceMap(options: PluginOptions, map: SourceMap) {
  if (process.env.__PLASMO_FRAMEWORK_INTERNAL_SOURCE_MAPS !== "none") {
    const newMap = new SourceMap(options.projectRoot)
    const mapBuffer = map.toBuffer()
    const lineOffset = 1
    newMap.addBuffer(mapBuffer, lineOffset)
    return newMap
  } else {
    return null
  }
}

export default new Optimizer({
  async optimize({ bundle, contents, map, options }) {
    vLog(
      "@plasmohq/parcel-optimizer-encapsulate",
      bundle.name,
      bundle.displayName
    )

    return {
      contents: `${beforeContent}\n${contents}${afterContent}`,
      map: getSourceMap(options, map)
    }
  }
})
