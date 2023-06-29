/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/blob/723e8443757cfb12a1a3af8180f0d923e666e1aa/packages/optimizers/esbuild/src/ESBuildOptimizer.js
 * MIT License
 */

import { Optimizer } from "@parcel/plugin"
import SourceMap from "@parcel/source-map"
import { transform as swcTransform } from "@swc/core"
import nullthrows from "nullthrows"

import { vLog } from "@plasmo/utils/logging"

import { blobToString } from "./blob-to-string"

export default new Optimizer({
  async optimize({
    contents,
    map: originalMap,
    bundle,
    options,
    getSourceMapReference
  }) {
    vLog(
      "@plasmohq/optimizer-es: ",
      bundle.name,
      bundle.displayName,
      options.projectRoot
    )

    const code = await blobToString(contents)

    if (!bundle.env.shouldOptimize) {
      vLog(`optimizer-es: skipped`)
      return {
        contents: code,
        map: originalMap
      }
    }

    const sourceMapType = process.env.__PLASMO_FRAMEWORK_INTERNAL_SOURCE_MAPS
    const shouldMinify =
      process.env.__PLASMO_FRAMEWORK_INTERNAL_NO_MINIFY === "false"

    vLog(`optimizer-es: use SWC for ${bundle.displayName}`)

    const swcOutput = await swcTransform(code, {
      jsc: {
        target: process.env.__PLASMO_FRAMEWORK_INTERNAL_ES_TARGET,
        minify: {
          mangle: shouldMinify,
          compress: shouldMinify,
          sourceMap: sourceMapType !== "none",
          toplevel:
            bundle.env.outputFormat === "esmodule" ||
            bundle.env.outputFormat === "commonjs",
          module: bundle.env.outputFormat === "esmodule"
        }
      },
      minify: shouldMinify,
      sourceMaps:
        sourceMapType === "inline" ? "inline" : sourceMapType === "external",
      configFile: false,
      swcrc: false
    })

    let sourceMap = null
    let minifiedContents = nullthrows(swcOutput.code)
    if (swcOutput.map) {
      sourceMap = new SourceMap(options.projectRoot)
      sourceMap.addVLQMap(JSON.parse(swcOutput.map))
      if (originalMap) {
        sourceMap.extends(originalMap)
      }
      let sourcemapReference = await getSourceMapReference(sourceMap)
      if (sourcemapReference) {
        minifiedContents += `\n//# sourceMappingURL=${sourcemapReference}\n`
      }
    }

    return {
      contents: minifiedContents,
      map: sourceMap
    }
  }
})
