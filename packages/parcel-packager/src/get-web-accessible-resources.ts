import type {
  BundleGraph,
  Dependency,
  NamedBundle,
  PluginOptions
} from "@parcel/types"
import nullthrows from "nullthrows"

import type {
  ExtensionManifest,
  ExtensionManifestV2,
  ExtensionManifestV3
} from "@plasmo/constants"

import { getRelativePath } from "./utils"

type Mv3Wars = ExtensionManifestV3["web_accessible_resources"]

export const getWarsFromContentScripts = (
  bundle: NamedBundle,
  bundleGraph: BundleGraph<NamedBundle>,
  dependencies: readonly Dependency[],
  contentScripts: ExtensionManifest["content_scripts"] = []
): Mv3Wars =>
  contentScripts
    .map((contentScript) => {
      const srcBundles = dependencies
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
              .map((b) => getRelativePath(bundle, b))
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
        .map((b) => getRelativePath(bundle, b))

      return resources.length > 0
        ? {
            matches: contentScript.matches.map((match) => {
              if (/^(((http|ws)s?)|ftp|\*):\/\//.test(match)) {
                let pathIndex = match.indexOf("/", match.indexOf("://") + 3)
                // Avoids creating additional errors in invalid match URLs
                if (pathIndex === -1) {
                  pathIndex = match.length
                }
                return match.slice(0, pathIndex) + "/*"
              }

              return match
            }),
            resources
          }
        : null
    })
    .filter(Boolean)

export function appendMv2Wars(
  manifest: ExtensionManifestV2,
  wars: Mv3Wars,
  _options: PluginOptions
) {
  const warResult = (manifest.web_accessible_resources || []).concat([
    ...new Set(wars.flatMap((entry) => entry.resources))
  ])

  if (warResult.length > 0) {
    manifest.web_accessible_resources = warResult
  }
}

export function appendMv3Wars(
  manifest: ExtensionManifestV3,
  wars: Mv3Wars,
  options: PluginOptions
) {
  if (options.hmrOptions) {
    wars.push({
      matches: ["<all_urls>"],
      resources: ["__parcel_hmr_proxy__"]
    })
  }
  if (wars.length > 0) {
    manifest.web_accessible_resources = wars
  }
}
