import { existsSync } from "fs"
import { readJson } from "fs-extra"
import { resolve } from "path"

import type {
  ExtensionManifest,
  ExtensionManifestV2,
  ExtensionManifestV3
} from "@plasmo/constants"
import { vLog } from "@plasmo/utils"

export const fromExistingManifest = async (currentDirectory: string) => {
  const manifestPath = resolve(currentDirectory, "manifest.json")

  if (!existsSync(manifestPath)) {
    return false
  }

  const manifestData: ExtensionManifest = await readJson(manifestPath)

  switch (manifestData.manifest_version) {
    case 2:
      await fromMv2(manifestData)
      break
    case 3:
      await fromMv3(manifestData)
      break
  }

  return true
}

async function fromMv2(manifestData: ExtensionManifestV2) {
  const manifestOverride: Partial<ExtensionManifestV3> = {}

  vLog("convert content_security_policy")

  vLog("convert web_accessible_resources")

  vLog("convert background")

  vLog("convert browser_action")

  vLog("convert permissions")

  vLog("convert content_scripts")

  // manifestData.content_scripts
}

async function fromMv3(manifestData: ExtensionManifestV3) {}
