import type { Graph, NodeId } from "@parcel/graph"
import type { Asset, Dependency } from "@parcel/types"
import type { DefaultMap } from "@parcel/utils"
import invariant from "assert"
import nullthrows from "nullthrows"

import type { Bundle } from "./types"

export function removeBundle(
  bundleGraph: Graph<Bundle | "root">,
  bundleId: NodeId,
  assetReference: DefaultMap<Asset, Array<[Dependency, Bundle]>>
) {
  let bundle = nullthrows(bundleGraph.getNode(bundleId))
  invariant(bundle !== "root")

  for (let asset of bundle.assets) {
    assetReference.set(
      asset,
      assetReference.get(asset).filter((t) => !t.includes(bundle))
    )

    for (let sourceBundleId of bundle.sourceBundles) {
      let sourceBundle = nullthrows(bundleGraph.getNode(sourceBundleId))
      invariant(sourceBundle !== "root")
      sourceBundle.assets.add(asset)
      sourceBundle.size += asset.stats.size
    }
  }

  bundleGraph.removeNode(bundleId)
}
