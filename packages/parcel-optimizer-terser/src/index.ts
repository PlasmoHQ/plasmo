/**
 * Copyright (c) 2022 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/blob/eed1e2ca5f4bde73975b01f78464af6a75258257/packages/optimizers/terser/src/TerserOptimizer.js
 * MIT License
 */

import { Optimizer } from "@parcel/plugin"
import SourceMap from "@parcel/source-map"
import { blobToString } from "@parcel/utils"
import nullthrows from "nullthrows"
import path from "path"
import { MinifyOptions, minify } from "terser"

export default new Optimizer({
  async loadConfig({ config, options }) {
    const userConfig = await config.getConfigFrom<MinifyOptions>(
      path.join(options.projectRoot, "index"),
      [".terserrc", ".terserrc.js", ".terserrc.cjs"]
    )

    if (userConfig) {
      const isJs = path.extname(userConfig.filePath) === ".js"

      if (isJs) {
        config.invalidateOnStartup()
      }
    }

    return userConfig?.contents || {}
  },

  async optimize({
    contents,
    map,
    bundle,
    config: { format = {}, ...userConfig },
    options,
    getSourceMapReference
  }) {
    if (!bundle.env.shouldOptimize) {
      return {
        contents,
        map
      }
    }

    const code = await blobToString(contents)
    const originalMap = map ? await map.stringify({}) : null
    const config: MinifyOptions = {
      ...userConfig,
      format: {
        ...format,
        ascii_only: true
      },
      sourceMap: bundle.env.sourceMap
        ? {
            filename: path.relative(
              options.projectRoot,
              path.join(bundle.target.distDir, bundle.name)
            ),
            content: originalMap as string
          }
        : false,
      toplevel:
        bundle.env.outputFormat === "esmodule" ||
        bundle.env.outputFormat === "commonjs",
      module: bundle.env.outputFormat === "esmodule"
    }

    const result = await minify(code, config)

    let sourceMap = null
    let minifiedContents = nullthrows(result.code)

    const resultMap = result.map

    if (resultMap && typeof resultMap !== "string") {
      const sourceMap = new SourceMap(options.projectRoot)
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
  }
})
