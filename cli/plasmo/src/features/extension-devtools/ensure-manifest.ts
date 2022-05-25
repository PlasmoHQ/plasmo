import { existsSync } from "fs-extra"
import { readdir } from "fs/promises"
import { resolve } from "path"

import { vLog } from "@plasmo/utils"

import type { CommonPath, ProjectPath } from "./common-paths"
import { PlasmoExtensionManifest } from "./plasmo-extension-manifest"

export async function ensureManifest(
  commonPath: CommonPath,
  {
    popupIndexList,
    optionsIndexList,
    contentsIndexPath,
    contentsDirectory,
    backgroundIndexPath,
    devtoolsIndexList
  }: ProjectPath
) {
  vLog("Creating Extension Manifest...")

  const hasPopup = popupIndexList.some(existsSync)
  const hasOptions = optionsIndexList.some(existsSync)
  const hasDevtools = devtoolsIndexList.some(existsSync)
  const hasBackground = existsSync(backgroundIndexPath)
  const hasContentsIndex = existsSync(contentsIndexPath)
  const hasContentsDirectory = existsSync(contentsDirectory)

  const manifestData = new PlasmoExtensionManifest(commonPath)

  await manifestData.updatePackageData()

  manifestData
    .togglePopup(hasPopup)
    .toggleOptions(hasOptions)
    .toggleBackground(hasBackground)
    .toggleDevtools(hasDevtools)

  await Promise.all([
    manifestData.createPopupScaffolds(),
    manifestData.createOptionsScaffolds(),
    manifestData.createDevtoolsScaffolds(),
    hasContentsIndex &&
      manifestData.toggleContentScript(contentsIndexPath, true),
    hasContentsDirectory &&
      readdir(contentsDirectory, { withFileTypes: true }).then((files) =>
        Promise.all(
          files
            .filter((f) => f.isFile())
            .map((f) => resolve(contentsDirectory, f.name))
            .map((filePath) => manifestData.toggleContentScript(filePath, true))
        )
      )
  ])

  await manifestData.write(true)

  return manifestData
}
