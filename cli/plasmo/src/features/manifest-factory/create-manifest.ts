import { existsSync } from "fs-extra"

import { vLog, wLog } from "@plasmo/utils"

import type { PlasmoBundleConfig } from "~features/extension-devtools/get-bundle-config"

import { PlasmoExtensionManifestMV2 } from "./mv2"
import { PlasmoExtensionManifestMV3 } from "./mv3"

export async function createManifest(bundleConfig: PlasmoBundleConfig) {
  vLog("Creating Manifest Factory...")
  const plasmoManifest =
    bundleConfig.manifestVersion === "mv3"
      ? new PlasmoExtensionManifestMV3(bundleConfig)
      : new PlasmoExtensionManifestMV2(bundleConfig)

  await plasmoManifest.startup()

  const { contentIndexList, backgroundIndexList } = plasmoManifest.projectPath

  const contentIndex = contentIndexList.find(existsSync)
  const backgroundIndex = backgroundIndexList.find(existsSync)

  const initResults = await Promise.all([
    plasmoManifest.scaffolder.init(),
    plasmoManifest.toggleContentScript(contentIndex, true),
    plasmoManifest.toggleBackground(backgroundIndex, true),
    plasmoManifest.addContentScriptsDirectory(),
    plasmoManifest.addTabsDirectory()
  ])

  const hasEntrypoints = initResults.flat()

  if (!hasEntrypoints.includes(true)) {
    wLog("Unable to find any entry files, the extension might be empty")
  }

  const [hasPopup, hasOptions, hasNewtab, hasDevtools] = hasEntrypoints

  plasmoManifest
    .togglePopup(hasPopup)
    .toggleOptions(hasOptions)
    .toggleNewtab(hasNewtab)
    .toggleDevtools(hasDevtools)

  await plasmoManifest.write(true)

  return plasmoManifest
}
