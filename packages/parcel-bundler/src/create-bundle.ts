import type { Asset, BundleBehavior, Environment, Target } from "@parcel/types"
import nullthrows from "nullthrows"

import type { Bundle } from "./types"

export function createBundle(opts: {
  uniqueKey?: string
  target: Target
  asset?: Asset
  env?: Environment
  type?: string
  needsStableName?: boolean
  bundleBehavior?: BundleBehavior | null | undefined
}): Bundle {
  if (opts.asset == null) {
    return {
      uniqueKey: opts.uniqueKey,
      assets: new Set(),
      internalizedAssetIds: [],
      mainEntryAsset: null,
      size: 0,
      sourceBundles: new Set(),
      target: opts.target,
      type: nullthrows(opts.type),
      env: nullthrows(opts.env),
      needsStableName: Boolean(opts.needsStableName),
      bundleBehavior: opts.bundleBehavior
    }
  }

  let asset = nullthrows(opts.asset)
  return {
    uniqueKey: opts.uniqueKey,
    assets: new Set([asset]),
    internalizedAssetIds: [],
    mainEntryAsset: asset,
    size: asset.stats.size,
    sourceBundles: new Set(),
    target: opts.target,
    type: opts.type ?? asset.type,
    env: opts.env ?? asset.env,
    needsStableName: Boolean(opts.needsStableName),
    bundleBehavior: opts.bundleBehavior ?? asset.bundleBehavior
  }
}
