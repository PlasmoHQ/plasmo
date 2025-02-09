import { dirname, resolve } from "path"
import type { Mapping } from "@mischnic/json-sourcemap"
import type {
  MutableAsset,
  PluginOptions,
  TransformerResult
} from "@parcel/types"

import type { ManifestData, MV2Data } from "./schema"

type ExtraAsset = TransformerResult

export const storeState = (
  asset: MutableAsset,
  program: ManifestData,
  ptrs: Record<string, Mapping>,
  options: PluginOptions
) => {
  const base = {
    extraAssets: [] as ExtraAsset[],
    program,
    hmrOptions: options.hmrOptions,
    hot: Boolean(options.hmrOptions),
    fs: asset.fs,
    filePath: asset.filePath,
    ptrs,
    asset,
    env: options.env,
    _isMV2: program.manifest_version === 2
  }
  const dotPlasmoDir = dirname(asset.filePath)
  const projectDir = resolve(dotPlasmoDir, "..")
  const assetsDir = resolve(projectDir, "assets")

  return {
    ...base,
    srcDir: process.env.PLASMO_SRC_DIR,
    dotPlasmoDir,
    projectDir,
    assetsDir,
    getAssets: () => [...base.extraAssets, asset]
  }
}

type StateParams = Parameters<typeof storeState>

type State = Partial<Awaited<ReturnType<typeof storeState>>>

let state: State = {}

export const getState = () => state

export const initState = async (...props: StateParams) => {
  state = storeState(...props)
}

export const checkMV2 = (program: ManifestData): program is MV2Data =>
  state._isMV2
