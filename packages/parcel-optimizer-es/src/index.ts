/**
 * Copyright (c) 2022 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/blob/723e8443757cfb12a1a3af8180f0d923e666e1aa/packages/optimizers/esbuild/src/ESBuildOptimizer.js
 * MIT License
 */

import { Optimizer } from "@parcel/plugin"
import SourceMap from "@parcel/source-map"
import { blobToString, normalizePath } from "@parcel/utils"
import { transform } from "esbuild"
import { join, relative } from "path"

import { toUtf8 } from "./to-utf8"

export default new Optimizer({
  async optimize({ contents, map, bundle, options, getSourceMapReference }) {
    let code = (await blobToString(contents)) as string

    if (!bundle.env.shouldOptimize) {
      return {
        contents: toUtf8(code),
        map
      }
    }

    const relativeBundlePath = relative(
      options.projectRoot,
      join(bundle.target.distDir, bundle.name)
    )

    if (map) {
      let vlqMappings = await map.stringify({
        file: normalizePath(relativeBundlePath + ".map"),
        format: "inline"
      })
      code += `\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,${vlqMappings}`
    }

    let { code: esOutput, map: esSourceMap } = await transform(code, {
      sourcemap: "external",
      sourcefile: relativeBundlePath,
      minify: true,
      treeShaking: true,
      format: "esm"
    })

    let sourcemap = null
    if (esSourceMap) {
      sourcemap = new SourceMap(options.projectRoot)
      let parsedMap = JSON.parse(esSourceMap)
      sourcemap.addVLQMap(parsedMap)

      let sourcemapReference = await getSourceMapReference(sourcemap)
      if (sourcemapReference) {
        esOutput += `\n//# sourceMappingURL=${sourcemapReference}\n`
      }
    }

    return {
      contents: esOutput,
      map: sourcemap || map
    }
  }
})
