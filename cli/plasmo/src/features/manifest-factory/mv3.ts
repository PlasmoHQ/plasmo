import { relative } from "path"

import type { ExtensionManifest } from "@plasmo/constants"

import type { CommonPath } from "~features/extension-devtools/common-path"

import { BaseFactory, iconMap } from "./base"

export class PlasmoExtensionManifestMV3 extends BaseFactory<ExtensionManifest> {
  constructor(commonPath: CommonPath, browser: string) {
    super(commonPath, browser)
    this.data.manifest_version = 3
    this.data.action = {
      default_icon: iconMap
    }
  }

  togglePopup = (enable = false) => {
    if (enable) {
      this.data.action.default_popup = "./popup.html"
    } else {
      delete this.data.action.default_popup
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
        service_worker: scriptPath,
        type: "module"
      }
    } else {
      delete this.data.background
    }

    return enable
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
