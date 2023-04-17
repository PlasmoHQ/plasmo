import { type Unzipped, strFromU8, unzipSync } from "fflate"
import { readJson } from "fs-extra"
import { readFile } from "fs/promises"
import { extname } from "path"

import type {
  ExtensionManifest,
  ExtensionManifestV2,
  ExtensionManifestV3,
  ManifestPermission
} from "@plasmo/constants"
import { vLog } from "@plasmo/utils/logging"

import type { CommonPath } from "~features/extension-devtools/common-path"
import {
  type PackageJSON,
  generatePackage
} from "~features/extension-devtools/package-file"
import type { PackageManagerInfo } from "~features/helpers/package-manager"

export const getManifestData = async (absPath: string) => {
  const data = {
    unzipped: {} as Unzipped,
    isZip: false,
    manifestData: {} as ExtensionManifest
  }

  const ext = extname(absPath)
  if (ext === ".zip") {
    const fileBuffer = await readFile(absPath)
    data.unzipped = unzipSync(fileBuffer)
    data.isZip = true
    data.manifestData = JSON.parse(strFromU8(data.unzipped["manifest.json"]))
  } else if (ext === ".json") {
    data.manifestData = await readJson(absPath)
  } else {
    return null
  }

  return data
}

export const generatePackageFromManifest = async (
  commonPath: CommonPath,
  packageManager: PackageManagerInfo,
  { manifestData }: Awaited<ReturnType<typeof getManifestData>>
) => {
  const packageData = await generatePackage({
    name: commonPath.packageName,
    packageManager
  })

  packageData.version = manifestData.version
  packageData.displayName = manifestData.name
  packageData.description = manifestData.description

  if (manifestData?.author) {
    packageData.author = manifestData.author
  }

  if (manifestData.homepage_url) {
    packageData.homepage = manifestData.homepage_url
  }

  if (manifestData.version_name) {
    packageData.manifest.version_name = manifestData.version_name
  }

  if (manifestData.browser_specific_settings) {
    packageData.manifest.browser_specific_settings =
      manifestData.browser_specific_settings
  }

  if (manifestData.default_locale) {
    vLog("Convert locale")
    // Copy all locale json files to assets
  }

  if (manifestData.options_ui) {
    vLog("Convert options_ui")
    // Create option.tsx if it doesn't exist
  }

  if (manifestData.chrome_url_overrides) {
    vLog("Convert chrome_url_overrides")
    // Create newtab.tsx if it doesn't exist
  }

  if (manifestData.icons) {
    vLog("Convert icons")
    // Copy the largest icon to icon.png
  }

  if (manifestData.content_scripts) {
    vLog("Convert content_scripts")
    // TODO: Create blank content scripts for each js file, with the appropriate config
  }

  switch (manifestData.manifest_version) {
    case 2:
      await fromMv2(manifestData, packageData, commonPath)
      break
    case 3:
      await fromMv3(manifestData, packageData, commonPath)
      break
    default:
      throw new Error("Unknown manifest version")
  }

  return packageData
}

async function fromMv2(
  manifestData: ExtensionManifestV2,
  packageData: PackageJSON,
  commonPath: CommonPath
) {
  if (manifestData.content_security_policy) {
    vLog("Convert content_security_policy")
    packageData.manifest.content_security_policy = {
      extension_pages: manifestData.content_security_policy
    }
  }

  if (manifestData.web_accessible_resources) {
    vLog("Convert web_accessible_resources")
    packageData.manifest.web_accessible_resources = [
      {
        matches: ["https://*/*"],
        resources: manifestData.web_accessible_resources
      }
    ]
  }

  if (manifestData.permissions) {
    vLog("Convert permissions")
    packageData.manifest.permissions = []
    packageData.manifest.host_permissions = []

    for (const permission of manifestData.permissions) {
      if (permission.startsWith("http") || permission === "<all_urls>") {
        packageData.manifest.host_permissions.push(permission)
      } else {
        packageData.manifest.permissions.push(permission as ManifestPermission)
      }
    }
  }

  if (manifestData.browser_action) {
    vLog("Convert browser_action")
    packageData.manifest.action = {
      default_title: manifestData.browser_action.default_title
    }
    // TODO: create popup.tsx
    // TODO: copy icons
  }

  if (manifestData.background) {
    vLog("Convert background")
    // TODO: create background.tsx
  }
}

async function fromMv3(
  manifestData: ExtensionManifestV3,
  packageData: PackageJSON,
  commonPath: CommonPath
) {
  if (manifestData.content_security_policy) {
    vLog("Convert content_security_policy")
    packageData.manifest.content_security_policy = {
      ...manifestData.content_security_policy
    }
  }

  if (manifestData.web_accessible_resources) {
    vLog("Convert web_accessible_resources")
    packageData.manifest.web_accessible_resources = [
      ...manifestData.web_accessible_resources
    ]
  }

  if (manifestData.permissions) {
    vLog("Transfer permissions")
    packageData.manifest.permissions = [...manifestData.permissions]
  }

  if (manifestData.host_permissions) {
    vLog("Transfer host_permissions")
    packageData.manifest.host_permissions = [...manifestData.host_permissions]
  }

  if (manifestData.action) {
    vLog("Convert browser_action")
    packageData.manifest.action = {
      default_title: manifestData.action.default_title
    }
    // TODO: create popup.tsx
    // TODO: copy icons
  }

  if (manifestData.background) {
    vLog("Convert background")
    // TODO: create background.tsx
  }
}
