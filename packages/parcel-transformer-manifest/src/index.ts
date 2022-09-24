/**
 * Copyright (c) 2022 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/tree/v2/packages/transformers/webextension
 * MIT License
 */
import { parse } from "@mischnic/json-sourcemap"
import { Transformer } from "@parcel/plugin"
import { validateSchema } from "@parcel/utils"

import { handleAction } from "./handle-action"
import { handleBackground } from "./handle-background"
import { handleContentScripts } from "./handle-content-scripts"
import { handleDeclarativeNetRequest } from "./handle-declarative-net-request"
import { handleDeepLOC } from "./handle-deep-loc"
import { handleDictionaries } from "./handle-dictionaries"
import { handleLocale } from "./handle-locale"
import { handleTabs } from "./handle-tabs"
import { normalizeManifest } from "./normalize-manifest"
import { MV2Schema, MV3Schema } from "./schema"
import { initState } from "./state"

async function collectDependencies() {
  normalizeManifest()

  await Promise.all([
    handleTabs(),
    handleLocale(),
    handleAction(),
    handleDeclarativeNetRequest()
  ])

  handleContentScripts()
  handleDictionaries()
  handleDeepLOC()
  handleBackground()
}

export default new Transformer({
  async transform({ asset, options }) {
    // Set environment to browser, since web extensions are always used in
    // browsers, and because it avoids delegating extra config to the user
    asset.setEnvironment({
      context: "browser",
      outputFormat:
        asset.env.outputFormat === "commonjs"
          ? "global"
          : asset.env.outputFormat,
      engines: {
        browsers: asset.env.engines.browsers
      },
      sourceMap: asset.env.sourceMap && {
        ...asset.env.sourceMap,
        inline: true,
        inlineSources: true
      },
      includeNodeModules: asset.env.includeNodeModules,
      sourceType: asset.env.sourceType,
      isLibrary: asset.env.isLibrary,
      shouldOptimize: asset.env.shouldOptimize,
      shouldScopeHoist: asset.env.shouldScopeHoist
    })

    const code = await asset.getCode()
    const parsed = parse(code)
    const data = parsed.data

    const schema = data.manifest_version === 3 ? MV3Schema : MV2Schema

    validateSchema.diagnostic(
      schema,
      {
        data,
        source: code,
        filePath: asset.filePath
      },
      "@plasmohq/parcel-transformer-manifest",
      "Invalid Web Extension manifest"
    )

    const { state, getAssets } = initState(
      asset,
      data,
      parsed.pointers,
      options.hmrOptions
    )

    await collectDependencies()

    state.asset.setCode(JSON.stringify(data, null, 2))
    state.asset.meta.webextEntry = true

    return getAssets()
  }
})
