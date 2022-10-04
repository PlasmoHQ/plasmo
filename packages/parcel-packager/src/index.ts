/**
 * Copyright (c) 2022 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/parcel-bundler/parcel/tree/v2/packages/packagers/webextension
 * MIT License
 */
import { Packager } from "@parcel/plugin"
import type { Asset } from "@parcel/types"
import { replaceURLReferences } from "@parcel/utils"
import assert from "assert"

import type { ExtensionManifest } from "@plasmo/constants"

import {
  appendMv2Wars,
  appendMv3Wars,
  getWarsFromContentScripts
} from "./get-web-accessible-resources"

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

    const manifest: ExtensionManifest = JSON.parse(
      await manifestAsset.getCode()
    )

    const dependencies = manifestAsset.getDependencies()

    const wars = getWarsFromContentScripts(
      bundle,
      bundleGraph,
      dependencies,
      manifest.content_scripts
    )

    if (manifest.manifest_version === 2) {
      appendMv2Wars(manifest, wars, options)
    } else {
      appendMv3Wars(manifest, wars, options)
      delete manifest.background?.type
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
