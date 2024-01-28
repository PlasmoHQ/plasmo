/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/blob/7023c08b7e99a9b8fd3c04995e4ef7ca92dee5c1/packages/transformers/css/src/CSSTransformer.js
 * MIT License
 */
import { cLog } from "../../../packages/utils/logging"
import { relative } from "path"
import { Transformer } from "@parcel/plugin"
import { remapSourceLocation } from "@parcel/utils"
import { Parcel } from '@parcel/core';

export default new Transformer({
  async transform({ asset, options }) {
    // Normalize the asset's environment so that properties that only affect JS don't cause CSS to be duplicated.
    // For example, with ESModule and CommonJS targets, only a single shared CSS bundle should be produced.
    const [code, originalMap] = await Promise.all([
      asset.getBuffer(),
      asset.getMap()
    ])

    let bundler = new Parcel({
      entries: asset.filePath,
      defaultConfig: '@parcel/config-default'
    });
    try {
      let { bundleGraph, buildTime } = await bundler.run();
      let bundles = bundleGraph.getBundles();
      console.log(`✨ Built ${bundles.length} bundles in ${buildTime}ms!`);

    } catch (err) {
      console.log(err.diagnostics);
    }
    cLog('in our transformer bb!!')
    cLog('asset', asset)
    cLog('options', options)
    cLog('code', code.toString("utf-8"))
    cLog('originalMap', originalMap)
    asset.setEnvironment({
      sourceType: "module",
      outputFormat: "commonjs",
      shouldScopeHoist: false
    })
    asset.bundleBehavior = 'inline';
    return [asset];
    // asset.setBuffer(res.code)

    // if (res.dependencies) {
    //   for (let dep of res.dependencies) {
    //     const loc = !originalMap
    //       ? dep.loc
    //       : remapSourceLocation(dep.loc, originalMap)

    //     if (dep.type === "import" && !res.exports) {
    //       asset.addDependency({
    //         specifier: dep.url,
    //         specifierType: "url",
    //         loc,
    //         meta: {
    //           // For the glob resolver to distinguish between `@import` and other URL dependencies.
    //           isCSSImport: true,
    //           media: dep.media
    //         }
    //       })
    //     } else if (dep.type === "url") {
    //       asset.addURLDependency(dep.url, {
    //         loc,
    //         meta: {
    //           placeholder: dep.placeholder
    //         }
    //       })
    //     }
    //   }
    // }

    return [asset]
  }
})
