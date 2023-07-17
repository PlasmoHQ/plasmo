/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/blob/7023c08b7e99a9b8fd3c04995e4ef7ca92dee5c1/packages/transformers/css/src/CSSTransformer.js
 * MIT License
 */

import { relative } from "path"
import { Transformer } from "@parcel/plugin"
import { remapSourceLocation } from "@parcel/utils"
import { transform } from "lightningcss"

import { getTargets } from "./get-tagets"

export default new Transformer({
  async transform({ asset, options }) {
    // Normalize the asset's environment so that properties that only affect JS don't cause CSS to be duplicated.
    // For example, with ESModule and CommonJS targets, only a single shared CSS bundle should be produced.
    const [code, originalMap] = await Promise.all([
      asset.getBuffer(),
      asset.getMap()
    ])

    const targets = getTargets(asset.env.engines.browsers)

    const res = transform({
      filename: relative(options.projectRoot, asset.filePath),
      targets,
      code,
      cssModules: true,
      analyzeDependencies: asset.meta.hasDependencies !== false,
      sourceMap: !!asset.env.sourceMap
    })

    asset.setBuffer(res.code)

    if (res.dependencies) {
      for (let dep of res.dependencies) {
        const loc = !originalMap
          ? dep.loc
          : remapSourceLocation(dep.loc, originalMap)

        if (dep.type === "import" && !res.exports) {
          asset.addDependency({
            specifier: dep.url,
            specifierType: "url",
            loc,
            meta: {
              // For the glob resolver to distinguish between `@import` and other URL dependencies.
              isCSSImport: true,
              media: dep.media
            }
          })
        } else if (dep.type === "url") {
          asset.addURLDependency(dep.url, {
            loc,
            meta: {
              placeholder: dep.placeholder
            }
          })
        }
      }
    }

    return [asset]
  }
})
