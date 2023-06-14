/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/blob/v2/packages/bundlers/default/package.json
 * MIT License
 */

import { Bundler } from "@parcel/plugin"

import { vLog } from "@plasmo/utils/logging"

import { createIdealGraph } from "./create-ideal-graph"
import { decorateLegacyGraph } from "./decorate-legacy-graph"
import { getEntryByTarget } from "./get-entry-by-target"

const EXTENSION_OPTIONS = {
  minBundles: 1_000_000_000,
  minBundleSize: 2_400,
  maxParallelRequests: 20
}

/**
 *
 * The Bundler works by creating an IdealGraph, which contains a BundleGraph that models bundles
 * connected to othervbundles by what references them, and thus models BundleGroups.
 *
 * First, we enter `bundle({bundleGraph, config})`. Here, "bundleGraph" is actually just the
 * assetGraph turned into a type `MutableBundleGraph`, which will then be mutated in decorate,
 * and turned into what we expect the bundleGraph to be as per the old (default) bundler structure
 *  & what the rest of Parcel expects a BundleGraph to be.
 *
 * `bundle({bundleGraph, config})` First gets a Mapping of target to entries, In most cases there is
 *  only one target, and one or more entries. (Targets are pertinent in monorepos or projects where you
 *  will have two or more distDirs, or output folders.) Then calls create IdealGraph and Decorate per target.
 *
 */
export default new Bundler({
  loadConfig({ options }) {
    // TODO: Maybe depend on whether it's BGSW or not, we enable bundle splitting
    // console.log(options)

    return EXTENSION_OPTIONS
  },

  bundle({ bundleGraph, config }) {
    vLog("@plasmohq/parcel-bundler")
    let targetMap = getEntryByTarget(bundleGraph) // Organize entries by target output folder/ distDir

    let graphs = []

    for (let entries of targetMap.values()) {
      // Create separate bundleGraphs per distDir
      graphs.push(createIdealGraph(bundleGraph, config, entries))
    }

    for (let g of graphs) {
      decorateLegacyGraph(g, bundleGraph) //mutate original graph
    }
  },

  optimize() {}
})
