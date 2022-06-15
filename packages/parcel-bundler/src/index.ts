import { hashString } from "@parcel/hash"
import { Bundler } from "@parcel/plugin"
import type {
  Asset,
  Bundle,
  BundleGroup,
  Dependency,
  MutableBundleGraph
} from "@parcel/types"
import { DefaultMap } from "@parcel/utils"
import invariant from "assert"
import nullthrows from "nullthrows"

const EXTENSION_OPTIONS = {
  minBundles: 10000000,
  minBundleSize: 3000,
  maxParallelRequests: 20
}

let skipOptimize = false

export default new Bundler({
  // RULES:
  // 1. If dep.isAsync or dep.isEntry, start a new bundle group.
  // 2. If an asset is a different type than the current bundle, make a parallel bundle in the same bundle group.
  // 3. If an asset is already in a parent bundle in the same entry point, exclude from child bundles.
  // 4. If an asset is only in separate isolated entry points (e.g. workers, different HTML pages), duplicate it.

  loadConfig() {
    return EXTENSION_OPTIONS
  },

  bundle({ bundleGraph, config }) {
    let bundleRoots: Map<Bundle, Array<Asset>> = new Map()
    let bundlesByEntryAsset: Map<Asset, Bundle> = new Map()
    let assetsToAddOnExit: DefaultMap<
      Dependency,
      Array<[Bundle, Asset]>
    > = new DefaultMap(() => [])

    // Step 1: create bundles for each of the explicit code split points.
    bundleGraph.traverse(
      {
        enter: (node, context: any, actions) => {
          if (node.type !== "dependency") {
            return {
              ...context,
              bundleGroup: context?.bundleGroup,
              bundleByType: context?.bundleByType,
              parentNode: node,
              parentBundle:
                bundlesByEntryAsset.get(node.value) ?? context?.parentBundle
            }
          }

          let dependency = node.value
          if (bundleGraph.isDependencySkipped(dependency)) {
            actions.skipChildren()
            return
          }

          let assets = bundleGraph.getDependencyAssets(dependency)
          let resolution = bundleGraph.getResolvedAsset(dependency, undefined)
          let bundleGroup = context?.bundleGroup
          // Create a new bundle for entries, lazy/parallel dependencies, isolated/inline assets.
          if (
            resolution &&
            (!bundleGroup ||
              dependency.priority === "lazy" ||
              dependency.priority === "parallel" ||
              resolution.bundleBehavior === "isolated" ||
              resolution.bundleBehavior === "inline")
          ) {
            let bundleByType: Map<string, Bundle> =
              context?.bundleByType ?? new Map()

            // Only create a new bundle group for entries, lazy dependencies, and isolated assets.
            // Otherwise, the bundle is loaded together with the parent bundle.
            if (
              !bundleGroup ||
              dependency.priority === "lazy" ||
              resolution.bundleBehavior === "isolated"
            ) {
              bundleGroup = bundleGraph.createBundleGroup(
                dependency,
                nullthrows(dependency.target ?? context?.bundleGroup?.target)
              )

              bundleByType = new Map()
            }

            for (let asset of assets) {
              let bundle = bundleGraph.createBundle({
                entryAsset: asset,
                needsStableName:
                  dependency.bundleBehavior === "inline" ||
                  asset.bundleBehavior === "inline"
                    ? false
                    : dependency.isEntry || dependency.needsStableName,
                bundleBehavior:
                  dependency.bundleBehavior ?? asset.bundleBehavior,
                target: bundleGroup.target
              })
              bundleByType.set(bundle.type, bundle)
              bundlesByEntryAsset.set(asset, bundle)
              bundleGraph.addBundleToBundleGroup(bundle, bundleGroup)

              // The bundle may have already been created, and the graph gave us back the original one...
              if (!bundleRoots.has(bundle)) {
                bundleRoots.set(bundle, [asset])
              }

              // If the bundle is in the same bundle group as the parent, create an asset reference
              // between the dependency, the asset, and the target bundle.
              if (bundleGroup === context?.bundleGroup) {
                bundleGraph.createAssetReference(dependency, asset, bundle)
              }
            }

            return {
              bundleGroup,
              bundleByType,
              parentNode: node,
              parentBundle: context?.parentBundle
            }
          }

          invariant(context != null)
          invariant(context.parentNode.type === "asset")
          invariant(context.parentBundle != null)
          invariant(bundleGroup != null)
          let parentAsset = context.parentNode.value
          let parentBundle = context.parentBundle
          let bundleByType = nullthrows(context.bundleByType)

          for (let asset of assets) {
            if (parentAsset.type === asset.type) {
              continue
            }

            let existingBundle = bundleByType.get(asset.type)
            if (existingBundle) {
              // If a bundle of this type has already been created in this group,
              // merge this subgraph into it.
              assetsToAddOnExit.get(node.value).push([existingBundle, asset])
              bundlesByEntryAsset.set(asset, existingBundle)
              bundleGraph.createAssetReference(
                dependency,
                asset,
                existingBundle
              )
            } else {
              let bundle = bundleGraph.createBundle({
                uniqueKey: asset.id,
                env: asset.env,
                type: asset.type,
                target: bundleGroup.target,
                needsStableName:
                  asset.bundleBehavior === "inline" ||
                  dependency.bundleBehavior === "inline" ||
                  (dependency.priority === "parallel" &&
                    !dependency.needsStableName)
                    ? false
                    : parentBundle.needsStableName,
                bundleBehavior:
                  dependency.bundleBehavior ?? asset.bundleBehavior,
                isSplittable: asset.isBundleSplittable ?? true,
                pipeline: asset.pipeline
              })
              bundleByType.set(bundle.type, bundle)
              bundlesByEntryAsset.set(asset, bundle)
              bundleGraph.createAssetReference(dependency, asset, bundle)

              // Queue the asset to be added on exit of this node, so we add dependencies first.
              assetsToAddOnExit.get(node.value).push([bundle, asset])
            }
          }

          return {
            ...context,
            parentNode: node
          }
        },
        exit: (node) => {
          if (node.type === "dependency" && assetsToAddOnExit.has(node.value)) {
            let assetsToAdd = assetsToAddOnExit.get(node.value)
            for (let [bundle, asset] of assetsToAdd) {
              let root = bundleRoots.get(bundle)
              if (root) {
                root.push(asset)
              } else {
                bundleRoots.set(bundle, [asset])
              }
            }

            assetsToAddOnExit.delete(node.value)
          }
        }
      },
      undefined
    )

    for (let [bundle, rootAssets] of bundleRoots) {
      for (let asset of rootAssets) {
        bundleGraph.addEntryToBundle(asset, bundle)
      }
    }

    // If there's only one bundle, we can skip the rest of the steps.
    skipOptimize = bundleRoots.size === 1
    if (skipOptimize) {
      return
    }

    invariant(config != null)

    // Step 2: Remove asset graphs that begin with entries to other bundles.
    bundleGraph.traverseBundles((bundle) => {
      if (
        bundle.bundleBehavior === "inline" ||
        bundle.bundleBehavior === "isolated" ||
        !bundle.isSplittable ||
        bundle.env.isIsolated()
      ) {
        return
      }

      // Skip bundles where the entry is reachable in a parent bundle. This can occur when both synchronously and
      // asynchronously importing an asset from a bundle. This asset will later be internalized into the parent.
      let entries = bundle.getEntryAssets()
      let mainEntry = entries[0]
      if (
        mainEntry == null ||
        entries.length !== 1 ||
        bundleGraph.isAssetReachableFromBundle(mainEntry, bundle)
      ) {
        return
      }

      let candidates = bundleGraph.getBundlesWithAsset(mainEntry).filter(
        (containingBundle) =>
          containingBundle.id !== bundle.id &&
          // Don't add to BundleGroups for entry bundles, as that would require
          // another entry bundle depending on these conditions, making it difficult
          // to predict and reference.
          // TODO: reconsider this. This is only true for the global output format.
          !containingBundle.needsStableName &&
          containingBundle.bundleBehavior !== "inline" &&
          containingBundle.bundleBehavior !== "isolated" &&
          containingBundle.isSplittable
      )

      for (let candidate of candidates) {
        let bundleGroups =
          bundleGraph.getBundleGroupsContainingBundle(candidate)
        if (
          Array.from(bundleGroups).every(
            (group) =>
              bundleGraph.getBundlesInBundleGroup(group).length <
              config.maxParallelRequests
          )
        ) {
          bundleGraph.createBundleReference(candidate, bundle)
          bundleGraph.removeAssetGraphFromBundle(mainEntry, candidate)
        }
      }
    }, undefined)

    // Step 3: Remove assets that are duplicated in a parent bundle.
    deduplicate(bundleGraph)
    internalizeReachableAsyncDependencies(bundleGraph)
  },
  optimize({ bundleGraph, config }) {
    // if only one bundle, no need to optimize
    if (skipOptimize) {
      return
    }

    invariant(config != null)

    // Step 5: Find duplicated assets in different bundle groups, and separate them into their own parallel bundles.
    // If multiple assets are always seen together in the same bundles, combine them together.
    // If the sub-graph from an asset is >= 30kb, and the number of parallel requests in the bundle group is < 5, create a new bundle containing the sub-graph.
    let candidateBundles: Map<
      string,
      {
        assets: Array<Asset>
        sourceBundles: Set<Bundle>
        size: number
      }
    > = new Map()

    bundleGraph.traverse((node, ctx, actions) => {
      if (node.type !== "asset") {
        return
      }

      let asset = node.value
      let containingBundles = bundleGraph
        .getBundlesWithAsset(asset)
        // Don't create shared bundles from entry bundles, as that would require
        // another entry bundle depending on these conditions, making it difficult
        // to predict and reference.
        // TODO: reconsider this. This is only true for the global output format.
        // This also currently affects other bundles with stable names, e.g. service workers.
        .filter((b) => {
          let entries = b.getEntryAssets()

          return (
            !b.needsStableName &&
            b.isSplittable &&
            entries.every((entry) => entry.id !== asset.id)
          )
        })

      if (containingBundles.length > config.minBundles) {
        let id = containingBundles
          .map((b) => b.id)
          .sort()
          .join(":")

        let candidate = candidateBundles.get(id)
        if (candidate) {
          candidate.assets.push(asset)
          for (let bundle of containingBundles) {
            candidate.sourceBundles.add(bundle)
          }
          candidate.size += bundleGraph.getTotalSize(asset)
        } else {
          candidateBundles.set(id, {
            assets: [asset],
            sourceBundles: new Set(containingBundles),
            size: bundleGraph.getTotalSize(asset)
          })
        }

        // Skip children from consideration since we added a parent already.
        actions.skipChildren()
      }
    }, undefined)

    // Sort candidates by size (consider larger bundles first), and ensure they meet the size threshold
    let sortedCandidates: Array<{
      assets: Array<Asset>
      sourceBundles: Set<Bundle>
      size: number
    }> = Array.from(candidateBundles.values())
      .filter((bundle) => bundle.size >= config.minBundleSize)
      .sort((a, b) => b.size - a.size)

    for (let { assets, sourceBundles } of sortedCandidates) {
      let firstBundle: Bundle
      let eligibleSourceBundles = new Set<Bundle>()

      for (let bundle of sourceBundles) {
        // Find all bundle groups connected to the original bundles
        let bundleGroups = bundleGraph.getBundleGroupsContainingBundle(bundle)
        // Check if all bundle groups are within the parallel request limit
        if (
          bundleGroups.every(
            (group) =>
              bundleGraph.getBundlesInBundleGroup(group).length <
              config.maxParallelRequests
          )
        ) {
          if (!firstBundle) {
            firstBundle = bundle
          }
          eligibleSourceBundles.add(bundle)
        }
      }

      // Do not create a shared bundle unless there are at least 2 source bundles
      if (eligibleSourceBundles.size < 2) {
        continue
      }

      let sharedBundle = bundleGraph.createBundle({
        uniqueKey: hashString(
          [...eligibleSourceBundles].map((b) => b.id).join(":")
        ),
        // Allow this bundle to be deduplicated. It shouldn't be further split.
        // TODO: Reconsider bundle/asset flags.
        isSplittable: true,
        env: firstBundle.env,
        target: firstBundle.target,
        type: firstBundle.type
      })

      // Remove all of the root assets from each of the original bundles
      // and reference the new shared bundle.
      for (let asset of assets) {
        bundleGraph.addAssetGraphToBundle(asset, sharedBundle)

        for (let bundle of eligibleSourceBundles) {
          {
            bundleGraph.createBundleReference(bundle, sharedBundle)
            bundleGraph.removeAssetGraphFromBundle(asset, bundle)
          }
        }
      }
    }

    // Remove assets that are duplicated between shared bundles.
    deduplicate(bundleGraph)
    internalizeReachableAsyncDependencies(bundleGraph)
  }
})

function deduplicate(bundleGraph: MutableBundleGraph) {
  bundleGraph.traverse((node) => {
    if (node.type === "asset") {
      let asset = node.value
      // Search in reverse order, so bundles that are loaded keep the duplicated asset, not later ones.
      // This ensures that the earlier bundle is able to execute before the later one.
      let bundles = bundleGraph.getBundlesWithAsset(asset).reverse()
      for (let bundle of bundles) {
        if (
          bundle.hasAsset(asset) &&
          bundleGraph.isAssetReachableFromBundle(asset, bundle)
        ) {
          bundleGraph.removeAssetGraphFromBundle(asset, bundle)
        }
      }
    }
  }, undefined)
}

function internalizeReachableAsyncDependencies(
  bundleGraph: MutableBundleGraph
): void {
  // Mark async dependencies on assets that are already available in
  // the bundle as internally resolvable. This removes the dependency between
  // the bundle and the bundle group providing that asset. If all connections
  // to that bundle group are removed, remove that bundle group.
  let asyncBundleGroups: Set<BundleGroup> = new Set()
  bundleGraph.traverse((node, _, actions) => {
    if (
      node.type !== "dependency" ||
      node.value.isEntry ||
      node.value.priority !== "lazy"
    ) {
      return
    }

    if (bundleGraph.isDependencySkipped(node.value)) {
      actions.skipChildren()
      return
    }

    const dependency = node.value
    if (dependency.specifierType === "url") {
      // Don't internalize dependencies on URLs, e.g. `new Worker('foo.js')`
      return
    }

    const resolution = bundleGraph.getResolvedAsset(dependency, undefined)
    if (resolution == null) {
      return
    }

    const externalResolution = bundleGraph.resolveAsyncDependency(
      dependency,
      undefined
    )

    if (externalResolution?.type === "bundle_group") {
      asyncBundleGroups.add(externalResolution.value)
    }

    for (let bundle of bundleGraph.getBundlesWithDependency(dependency)) {
      if (
        bundle.hasAsset(resolution) ||
        bundleGraph.isAssetReachableFromBundle(resolution, bundle)
      ) {
        bundleGraph.internalizeAsyncDependency(bundle, dependency)
      }
    }
  }, undefined)

  // Remove any bundle groups that no longer have any parent bundles.
  for (let bundleGroup of asyncBundleGroups) {
    if (bundleGraph.getParentBundlesOfBundleGroup(bundleGroup).length === 0) {
      bundleGraph.removeBundleGroup(bundleGroup)
    }
  }
}
