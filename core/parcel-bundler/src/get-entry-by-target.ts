// @ts-nocheck
import type { Asset, Dependency, MutableBundleGraph } from "@parcel/types"
import { DefaultMap } from "@parcel/utils"
import invariant from "assert"

export function getEntryByTarget(
  bundleGraph: MutableBundleGraph
): DefaultMap<string, Map<Asset, Dependency>> {
  // Find entries from assetGraph per target
  let targets: DefaultMap<string, Map<Asset, Dependency>> = new DefaultMap(
    () => new Map()
  )
  bundleGraph.traverse(
    {
      enter(node, context, actions) {
        if (node.type !== "asset") {
          return node
        }

        invariant(
          context != null &&
            context.type === "dependency" &&
            context.value.isEntry &&
            context.value.target != null
        )
        targets.get(context.value.target.distDir).set(node.value, context.value)
        actions.skipChildren()
        return node
      }
    },
    undefined
  )

  return targets
}
