import type { DependencyOptions } from "@parcel/types"

import { injectEnv } from "@plasmo/utils/env"
import { wLog } from "@plasmo/utils/logging"

import { getState } from "./state"

export const addExtraAssets = async (
  filePath: string,
  bundlePath: string,
  type = "json",
  dependencies = [] as DependencyOptions[]
) => {
  const { asset, fs, extraAssets } = getState()
  const rawContent = await fs.readFile(filePath, "utf8")
  const parsedContent = injectEnv(rawContent)
  extraAssets.push({
    type,
    uniqueKey: bundlePath,
    content: parsedContent,
    bundleBehavior: "isolated",
    isBundleSplittable: type !== "json",
    env: asset.env,
    dependencies,
    meta: {
      bundlePath,
      webextEntry: false
    }
  })
}

export const wLogOnce = (msg: string) => {
  if (!!process.env.__PLASMO_FRAMEWORK_INTERNAL_WATCHER_STARTED) {
    return
  }
  wLog(msg)
}
