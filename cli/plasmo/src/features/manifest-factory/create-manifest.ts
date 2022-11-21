import { existsSync } from "fs-extra"

import { vLog, wLog } from "@plasmo/utils/logging"

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

  const {
    contentIndexList,
    backgroundIndexList,
    sandboxIndexList,
    tabsDirectory,
    sandboxesDirectory
  } = plasmoManifest.projectPath

  const [contentIndex, backgroundIndex, sandboxIndex] = [
    contentIndexList,
    backgroundIndexList,
    sandboxIndexList
  ].map((l) => l.find(existsSync))

  const initResults = await Promise.all([
    plasmoManifest.scaffolder.init(),
    plasmoManifest.togglePage(sandboxIndex, true),

    plasmoManifest.toggleContentScript(contentIndex, true),
    plasmoManifest.toggleBackground(backgroundIndex, true),
    plasmoManifest.addContentScriptsDirectory(),

    plasmoManifest.addPagesDirectory(tabsDirectory),
    plasmoManifest.addPagesDirectory(sandboxesDirectory)
  ])

  const hasEntrypoints = initResults.flat()

  if (!hasEntrypoints.includes(true)) {
    wLog("Unable to find any entry files. The extension might be empty")
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
