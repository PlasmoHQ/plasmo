/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/blob/723e8443757cfb12a1a3af8180f0d923e666e1aa/packages/optimizers/esbuild/src/ESBuildOptimizer.js
 * MIT License
 */

import { Optimizer } from "@parcel/plugin"
import SourceMap from "@parcel/source-map"
import { blobToString } from "@parcel/utils"
import { transform } from "esbuild"
import nullthrows from "nullthrows"
import { join, relative } from "path"
import { type MinifyOptions, minify } from "terser"

import { vLog } from "@plasmo/utils/logging"

import { toUtf8 } from "./to-utf8"

export default new Optimizer({
  async optimize({ contents, map, bundle, options, getSourceMapReference }) {
    let code = (await blobToString(contents)) as string

    if (!bundle.env.shouldOptimize) {
      vLog(`optimizer-es: skipped`)
      return {
        contents: toUtf8(code),
        map
      }
    }

    const relativeBundlePath = relative(
      options.projectRoot,
      join(bundle.target.distDir, bundle.name)
    )

    // Use terser for prod sourcemaps OR no-hoist build
    if (
      process.env.__PLASMO_FRAMEWORK_INTERNAL_SOURCE_MAPS !== "none" ||
      !bundle.env.shouldScopeHoist
    ) {
      vLog(`optimizer-es: use TERSER for ${relativeBundlePath}`)
      const originalMap = map ? await map.stringify({}) : null
      const config: MinifyOptions = {
        format: {
          ascii_only: true
        },
        sourceMap: bundle.env.sourceMap
          ? ({
              filename: relativeBundlePath,
              asObject: true,
              content: originalMap
            } as any)
          : false,
        toplevel:
          bundle.env.outputFormat === "esmodule" ||
          bundle.env.outputFormat === "commonjs",
        module: bundle.env.outputFormat === "esmodule"
      }

      const result = await minify(code, config)

      let minifiedContents: string = nullthrows(result.code)

      let sourceMap = null
      let resultMap = result.map

      if (resultMap && typeof resultMap !== "string") {
        sourceMap = new SourceMap(options.projectRoot)
        sourceMap.addVLQMap(resultMap)
        const sourcemapReference = await getSourceMapReference(sourceMap)
        if (sourcemapReference) {
          minifiedContents += `\n//# sourceMappingURL=${sourcemapReference}\n`
        }
      }

      return {
        contents: minifiedContents,
        map: sourceMap
      }
    } else {
      vLog(`optimizer-es: use ESBUILD for ${relativeBundlePath}`)
      // const config: MinifyOptions = {
      //   format: {
      //     ascii_only: true,
      //   },
      //   sourceMap: false,
      //   toplevel:
      //     bundle.env.outputFormat === "esmodule" ||
      //     bundle.env.outputFormat === "commonjs",
      //   module: bundle.env.outputFormat === "esmodule"
      // }

      // const terserOutput = await minify(code, config)

      const esbuildOutput = await transform(code, {
        sourcefile: relativeBundlePath,
        sourcemap: false,
        minify: true,
        treeShaking: true,
        format: "esm",
        platform: "browser"
      })

      // console.log(">>> BUILD FOR:", relativeBundlePath)
      // console.log(">>> >>> terser: ", terserOutput.code.length)
      // console.log(">>> >>> esbuild: ", esbuildOutput.code.length)

      return {
        contents: esbuildOutput.code,
        map: null
      }
    }
  }
})
