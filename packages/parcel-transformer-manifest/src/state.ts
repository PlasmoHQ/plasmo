import type { Mapping } from "@mischnic/json-sourcemap"
import type { FileSystem } from "@parcel/fs"
import type {
  DependencyOptions,
  HMROptions,
  MutableAsset,
  TransformerResult
} from "@parcel/types"
import { existsSync } from "fs"
import { dirname, resolve } from "path"

import type { MV2Data, ManifestData } from "./schema"

export const state = {
  program: null as ManifestData,
  hot: false,
  fs: null as FileSystem,

  filePath: "",
  dotPlasmoDir: "",
  staticDir: "",
  projectDir: "",
  srcDir: "",
  assetsDir: "",

  ptrs: null as Record<string, Mapping>,
  asset: null as MutableAsset,
  hmrOptions: null as HMROptions,
  needRuntimeBG: false,

  extraAssets: [] as TransformerResult[],

  _isMV2: false
}

export const addExtraAssets = async (
  filePath: string,
  bundlePath: string,
  type = "json",
  dependencies = [] as DependencyOptions[]
) => {
  state.extraAssets.push({
    type,
    uniqueKey: bundlePath,
    content: await state.asset.fs.readFile(filePath, "utf8"),
    pipeline: type === "json" ? "raw-env" : undefined,
    bundleBehavior: "isolated",
    isBundleSplittable: type !== "json",
    env: state.asset.env,
    dependencies,
    meta: {
      bundlePath,
      webextEntry: false
    }
  })
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

  state.dotPlasmoDir = dirname(asset.filePath)

  state.staticDir = resolve(state.dotPlasmoDir, "static")
  state.projectDir = resolve(state.dotPlasmoDir, "..")

  const srcDir = resolve(
    state.projectDir,
    process.env.PLASMO_SRC_PATH || "src"
  )
  state.srcDir = existsSync(srcDir) ? srcDir : state.projectDir

  state.assetsDir = resolve(state.projectDir, "assets")

  state.ptrs = ptrs
  state.asset = asset

  state._isMV2 = program.manifest_version === 2

  return {
    state,
    getAssets: () => [...state.extraAssets, asset]
  }
}

export const checkMV2 = (program: ManifestData): program is MV2Data =>
  state._isMV2
