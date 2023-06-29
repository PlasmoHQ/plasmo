import nullthrows from "nullthrows"

import type { BundleRoot } from "./types"

export function getReachableBundleRoots(asset, graph): Array<BundleRoot> {
  return graph
    .getNodeIdsConnectedTo(graph.getNodeIdByContentKey(asset.id))
    .map((nodeId) => nullthrows(graph.getNode(nodeId)))
}
