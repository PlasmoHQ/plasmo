/**
 * Copyright (c) 2022 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/tree/v2/packages/packagers/webextension
 * MIT License
 */
import { Packager } from "@parcel/plugin"
import type { Asset, NamedBundle } from "@parcel/types"
import { relativeBundlePath, replaceURLReferences } from "@parcel/utils"
import assert from "assert"
import nullthrows from "nullthrows"

export default new Packager({
  async package({ bundle, bundleGraph, options }) {
    const assets: Asset[] = []
    bundle.traverseAssets((asset) => {
      assets.push(asset)
    })

    const manifestEntryAssets = assets.filter(
      (a) => a.meta.webextEntry === true
    )
    assert(
      assets.length === 2 && manifestEntryAssets.length === 1,
      "Web extension bundles must contain exactly one manifest asset and one runtime asset"
    )
    const [manifestAsset] = manifestEntryAssets

    const relPath = (b: NamedBundle): string =>
      relativeBundlePath(bundle, b, {
        leadingDotSlash: false
      })

    const manifest = JSON.parse(await manifestAsset.getCode())
    const deps = manifestAsset.getDependencies()
    const war = []

    const isMv2 = manifest.version === 2

    for (const contentScript of manifest.content_scripts || []) {
      const srcBundles = deps
        .filter(
          (d) =>
            contentScript.js?.includes(d.id) ||
            contentScript.css?.includes(d.id)
        )
        .map((d) => nullthrows(bundleGraph.getReferencedBundle(d, bundle)))
      contentScript.css = [
        ...new Set(
          (contentScript.css || []).concat(
            srcBundles
              .flatMap((b) => bundleGraph.getReferencedBundles(b))
              .filter((b) => b.type == "css")
              .map(relPath)
          )
        )
      ]
      const resources = srcBundles
        .flatMap((b) => {
          const children: NamedBundle[] = []
          const siblings = bundleGraph.getReferencedBundles(b)
          bundleGraph.traverseBundles((child) => {
            if (b !== child && !siblings.includes(child)) {
              children.push(child)
            }
          }, b)
          return children
        })
        .map(relPath)

      if (resources.length > 0) {
        war.push({
          matches: contentScript.matches.map((match) => {
            if (/^(((http|ws)s?)|ftp|\*):\/\//.test(match)) {
              let pathIndex = match.indexOf("/", match.indexOf("://") + 3)
              // Avoids creating additional errors in invalid match URLs
              if (pathIndex === -1) pathIndex = match.length
              return match.slice(0, pathIndex) + "/*"
            }

            return match
          }),
          resources
        })
      }
    }

    if (!isMv2 && options.hmrOptions) {
      war.push({
        matches: ["<all_urls>"],
        resources: ["__parcel_hmr_proxy__"]
      })
    }

    const warResult = (manifest.web_accessible_resources || []).concat(
      isMv2 ? [...new Set(war.flatMap((entry) => entry.resources))] : war
    )

    if (warResult.length > 0) {
      manifest.web_accessible_resources = warResult
    }

    const { contents } = replaceURLReferences({
      bundle,
      bundleGraph,
      contents: JSON.stringify(manifest)
    })

    return {
      contents
    }
  }
})
