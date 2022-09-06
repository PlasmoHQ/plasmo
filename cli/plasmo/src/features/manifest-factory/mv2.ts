import { relative } from "path"

import type { ExtensionManifest, ExtensionManifestV2 } from "@plasmo/constants"

import type { CommonPath } from "~features/extension-devtools/common-path"

import { BaseFactory } from "./base"

export class PlasmoExtensionManifestMV2 extends BaseFactory<ExtensionManifestV2> {
  constructor(commonPath: CommonPath, browser: string) {
    super(commonPath, browser)

    this.data.manifest_version = 2
    this.data.browser_action = {
      default_icon: {
        "16": "./gen-assets/icon16.png",
        "32": "./gen-assets/icon32.png",
        "48": "./gen-assets/icon48.png"
      }
    }
  }

  togglePopup = (enable = false) => {
    if (enable) {
      this.data.browser_action.default_popup = "./popup.html"
    } else {
      delete this.data.browser_action.default_popup
    }
    return this
  }

  toggleBackground = (path: string, enable = false) => {
    if (path === undefined) {
      return false
    }

    if (enable) {
      const scriptPath = relative(this.commonPath.dotPlasmoDirectory, path)
      this.data.background = {
        scripts: [scriptPath]
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
        manifest.content_security_policy.extension_pages
    }

    return output
  }

  protected resolveWAR = (war: ExtensionManifest["web_accessible_resources"]) =>
    Promise.all(
      war.map(async ({ resources }) => {
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
