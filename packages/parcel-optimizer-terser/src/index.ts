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
import { extname, join, relative } from "path"
import { MinifyOptions, minify } from "terser"

import { toUtf8 } from "./to-utf8"

export default new Optimizer({
  async loadConfig({ config, options }) {
    const userConfig = await config.getConfigFrom<MinifyOptions>(
      join(options.projectRoot, "index"),
      [".terserrc", ".terserrc.js", ".terserrc.cjs"]
    )

    if (userConfig) {
      const isJs = extname(userConfig.filePath) === ".js"

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
    const code = (await blobToString(contents)) as string

    if (!bundle.env.shouldOptimize) {
      return {
        contents: toUtf8(code),
        map
      }
    }

    const originalMap = map ? await map.stringify({}) : null
    const config: MinifyOptions = {
      // format: {
      //   ...format,
      //   ascii_only: true
      // },
      sourceMap: bundle.env.sourceMap
        ? ({
            filename: relative(
              options.projectRoot,
              join(bundle.target.distDir, bundle.name)
            ),
            asObject: true,
            content: originalMap
          } as any)
        : false,
      toplevel:
        bundle.env.outputFormat === "esmodule" ||
        bundle.env.outputFormat === "commonjs",
      module: bundle.env.outputFormat === "esmodule",
      ...userConfig
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
  }
})
