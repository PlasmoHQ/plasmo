import { relative } from "path"

import type { ExtensionManifest, ExtensionManifestV2 } from "@plasmo/constants"

import type { CommonPath } from "~features/extension-devtools/common-path"

import { BaseFactory } from "./base"

export class PlasmoExtensionManifestMV2 extends BaseFactory<ExtensionManifestV2> {
  constructor(commonPath: CommonPath) {
    super(commonPath)

    this.data.manifest_version = 2
    this.data.browser_action = {
      default_icon: {
        "16": "./gen-assets/icon16.png",
        "48": "./gen-assets/icon48.png"
      }
    }
  }

  togglePopup = (enable = false) => {
    if (enable) {
      this.data.browser_action.default_popup = "./static/popup/index.html"
    } else {
      delete this.data.browser_action.default_popup
    }
    return this
  }

  toggleBackground = (path: string, enable = false) => {
    if (path === undefined) {
      return this
    }

    if (enable) {
      const scriptPath = relative(this.commonPath.dotPlasmoDirectory, path)
      this.data.background = {
        scripts: [scriptPath]
      }
    } else {
      delete this.data.background
    }

    return this
  }

  protected prepareOverrideManifest = () => {
    const output = {
      ...this.packageData.manifest
    }

    // Merge host permissions into permissions
    if (output.host_permissions) {
      output.permissions = [
        ...output.permissions,
        ...output.host_permissions
      ] as any
      delete output.host_permissions
    }

    return output as any
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
