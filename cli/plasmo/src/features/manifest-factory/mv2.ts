import { relative } from "path"

import type {
  ExtensionManifestV2,
  ExtensionManifestV3
} from "@plasmo/constants"

import type { PlasmoBundleConfig } from "~features/extension-devtools/get-bundle-config"

import { PlasmoManifest, iconMap } from "./base"

export class PlasmoExtensionManifestMV2 extends PlasmoManifest<ExtensionManifestV2> {
  constructor(bundleConfig: PlasmoBundleConfig) {
    super(bundleConfig)

    this.data.manifest_version = 2
    this.data.browser_action = {
      default_icon: iconMap
    }
  }

  togglePopup = (enable = false) => {
    if (enable) {
      this.data.browser_action!.default_popup = "./popup.html"
    } else {
      delete this.data.browser_action!.default_popup
    }
    return this
  }

  toggleBackground = (enable = false) => {
    if (enable) {
      this.data.background = {
        scripts: ["./static/background/index.ts"]
      }
    } else {
      delete this.data.background
    }

    return enable
  }

  protected prepareOverrideManifest = () => {
    const { manifest } = this.packageData
    const output = {
      ...manifest
    } as unknown as ExtensionManifestV2

    // Merge host permissions into permissions
    output.permissions = [
      ...(manifest.permissions || []),
      ...(manifest.host_permissions || [])
    ] as any

    if ("host_permissions" in output) {
      delete output["host_permissions"]
    }

    if ("content_security_policy" in manifest) {
      output.content_security_policy =
        manifest.content_security_policy?.extension_pages
    }

    return output
  }

  protected resolveWAR = (
    war: ExtensionManifestV3["web_accessible_resources"]
  ) =>
    Promise.all(
      war!.map(async ({ resources }) => {
        const resolvedResources = await Promise.all(
          resources.map(
            async (resourcePath) =>
              (await this.copyNodeModuleFile(resourcePath)) ||
              (await this.copyProjectFile(resourcePath))
          )
        )

        return resolvedResources.flat()
      })
    ).then((res) => res.flat())
}
