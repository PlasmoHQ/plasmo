/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 */
import { Transformer } from "@parcel/plugin"

import { iLog, vLog } from "@plasmo/utils/logging"

import { initState } from "./state"

async function collectDependencies() {}

export default new Transformer({
  async transform({ asset, options }) {
    vLog("@plasmohq/parcel-transformer-lab")
    const code = await asset.getCode()

    const { state, getAssets } = initState(asset, code, options.hmrOptions)

    if (asset.filePath.includes("hook.ts")) {
      iLog("Hook file: ", asset.filePath)
    }

    if (asset.filePath.endsWith("options.tsx")) {
      iLog("MONITORING: ", asset.filePath)

      // asset.addDependency({
      //   specifier: "storage-hook",
      //   specifierType: "esm",
      //   bundleBehavior: "isolated",
      //   resolveFrom: asset.filePath
      // })
    }

    await collectDependencies()

    return getAssets()
  }
})
