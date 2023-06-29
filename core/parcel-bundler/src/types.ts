import type { ContentGraph, Graph, NodeId } from "@parcel/graph"
import type {
  Asset,
  BundleBehavior,
  Dependency,
  Environment,
  Target
} from "@parcel/types"
import type { DefaultMap } from "@parcel/utils"

import type { BitSet } from "./bit-set"

type AssetId = string

export type DependencyBundleGraph = ContentGraph<
  | {
      value: Bundle
      type: "bundle"
    }
  | {
      value: Dependency
      type: "dependency"
    },
  number
>
// IdealGraph is the structure we will pass to decorate,
// which mutates the assetGraph into the bundleGraph we would
// expect from default bundler
export type IdealGraph = {
  dependencyBundleGraph: DependencyBundleGraph
  bundleGraph: Graph<Bundle | "root">
  bundleGroupBundleIds: Set<NodeId>
  assetReference: DefaultMap<Asset, Array<[Dependency, Bundle]>>
}

export type Bundle = {
  uniqueKey: string | null | undefined
  assets: Set<Asset>
  internalizedAsset?: BitSet<Asset>
  internalizedAssetIds: Array<AssetId>
  bundleBehavior?: BundleBehavior | null | undefined
  needsStableName: boolean
  mainEntryAsset: Asset | null | undefined
  size: number
  sourceBundles: Set<NodeId>
  target: Target
  env: Environment
  type: string
}

/* BundleRoot - An asset that is the main entry of a Bundle. */
export type BundleRoot = Asset

export const dependencyPriorityEdges = {
  sync: 1,
  parallel: 2,
  lazy: 3
}

export type ResolvedBundlerConfig = {
  minBundles: number
  minBundleSize: number
  maxParallelRequests: number
}
