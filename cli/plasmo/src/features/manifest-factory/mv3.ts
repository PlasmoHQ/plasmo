import { relative } from "path"

import type { ExtensionManifest } from "@plasmo/constants"

import type { CommonPath } from "~features/extension-devtools/common-path"

import { BaseFactory } from "./base"

export class PlasmoExtensionManifestMV3 extends BaseFactory<ExtensionManifest> {
  constructor(commonPath: CommonPath) {
    super(commonPath)
    this.data.manifest_version = 3
    this.data.action = {
      default_icon: {
        "16": "./gen-assets/icon16.png",
        "48": "./gen-assets/icon48.png"
      }
    }
  }

  togglePopup = (enable = false) => {
    if (enable) {
      this.data.action.default_popup = "./static/popup/index.html"
    } else {
      delete this.data.action.default_popup
    }
    return this
  }

  toggleBackground = (path: string, enable = false) => {
    if (enable) {
      const scriptPath = relative(this.commonPath.dotPlasmoDirectory, path)
      this.data.background = {
        service_worker: scriptPath,
        type: "module"
      }
    } else {
      delete this.data.background
    }

    return this
  }

  protected prepareOverrideManifest = () => ({
    ...this.packageData.manifest
  })

  protected resolveWAR = (war: ExtensionManifest["web_accessible_resources"]) =>
    Promise.all(
      war.map(async ({ resources, matches }) => {
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
