import type { Mapping } from "@mischnic/json-sourcemap"
import type { FileSystem } from "@parcel/fs"
import type { HMROptions, MutableAsset } from "@parcel/types"
import { dirname } from "path"

import type { MV2Data, ManifestData } from "./schema"

export const state = {
  program: null as ManifestData,
  hot: false,
  fs: null as FileSystem,
  filePath: null as string,
  assetDir: null as string,
  ptrs: null as Record<string, Mapping>,
  asset: null as MutableAsset,
  hmrOptions: null as HMROptions,
  needRuntimeBG: false,
  _isMV2: false
}

export const initState = (
  asset: MutableAsset,
  program: ManifestData,
  ptrs: Record<string, any>,
  hmrOptions: HMROptions | null | undefined
) => {
  state.program = program
  state.hmrOptions = hmrOptions
  state.hot = Boolean(hmrOptions)
  state.fs = asset.fs
  state.filePath = asset.filePath
  state.assetDir = dirname(asset.filePath)
  state.ptrs = ptrs
  state.asset = asset

  state._isMV2 = program.manifest_version === 2
}

export const checkMV2 = (program: ManifestData): program is MV2Data =>
  state._isMV2
