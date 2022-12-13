import { relative } from "path"

import type { ExtensionManifestV3 } from "@plasmo/constants"

import type { PlasmoBundleConfig } from "~features/extension-devtools/get-bundle-config"

import { BaseFactory, iconMap } from "./base"

export class PlasmoExtensionManifestMV3 extends BaseFactory<ExtensionManifestV3> {
  constructor(bundleConfig: PlasmoBundleConfig) {
    super(bundleConfig)
    this.data.manifest_version = 3
    this.data.action = {
      default_icon: iconMap
    }
  }

  togglePopup = (enable = false) => {
    if (enable) {
      this.data.action!.default_popup = "./popup.html"
    } else {
      delete this.data.action!.default_popup
    }
    return this
  }

  toggleBackground = (enable = false) => {
    if (enable) {
      this.data.background = {
        service_worker: "./static/background/index.ts"
      }
    } else {
      delete this.data.background
    }

    return enable
  }

  protected prepareOverrideManifest = () => ({
    ...this.packageData!.manifest
  })

  protected resolveWAR = (
    war: ExtensionManifestV3["web_accessible_resources"]
  ) =>
    Promise.all(
      war!.map(async ({ resources, matches }) => {
        const resolvedResources = await Promise.all(
          resources.map(
            async (resourcePath) =>
              (await this.copyNodeModuleFile(resourcePath)) ||
              (await this.copyProjectFile(resourcePath))
          )
        )

        return {
          resources: resolvedResources.flat(),
          matches
        }
      })
    )
}
