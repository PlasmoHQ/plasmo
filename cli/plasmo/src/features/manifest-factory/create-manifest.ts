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

  const hasEntrypoints = await Promise.all([
    plasmoManifest.scaffolder.initTemplateFiles("popup"),
    plasmoManifest.scaffolder.initTemplateFiles("options"),
    plasmoManifest.scaffolder.initTemplateFiles("newtab"),
    plasmoManifest.scaffolder.initTemplateFiles("devtools"),
    plasmoManifest.toggleContentScript(contentIndex, true),
    plasmoManifest.toggleBackground(backgroundIndex, true),
    plasmoManifest.addContentScriptsDirectory(),
    plasmoManifest.addTabsDirectory()
  ])

  if (!hasEntrypoints.includes(true)) {
    wLog(
      "Unable to find any entrypoints. You may end up with an empty extension..."
    )
  }

  const [hasPopup, hasOptions, hasNewtab, hasDevtools] = hasEntrypoints

  plasmoManifest
    .togglePopup(hasPopup)
    .toggleOptions(hasOptions)
    .toggleDevtools(hasDevtools)
    .toggleNewtab(hasNewtab)

  await plasmoManifest.write(true)

  return plasmoManifest
}
