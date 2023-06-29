import type { FileSystem } from "@parcel/fs"
import type {
  DependencyOptions,
  HMROptions,
  MutableAsset,
  TransformerResult
} from "@parcel/types"

export const state = {
  code: "",
  hot: false,
  fs: null as FileSystem,

  filePath: "",

  asset: null as MutableAsset,

  extraAssets: [] as TransformerResult[]
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
  code: string,
  hmrOptions: HMROptions | null | undefined
) => {
  state.code = code
  state.fs = asset.fs
  state.filePath = asset.filePath

  state.asset = asset

  return {
    state,
    getAssets: () => [...state.extraAssets, asset]
  }
}
