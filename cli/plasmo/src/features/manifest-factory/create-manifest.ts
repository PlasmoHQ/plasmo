import { ensureDir, existsSync } from "fs-extra"
import { readdir } from "fs/promises"
import { resolve } from "path"

import { vLog } from "@plasmo/utils"

import type { CommonPath } from "~features/extension-devtools/common-path"
import { generateIcons } from "~features/extension-devtools/generate-icons"
import { generateLocales } from "~features/extension-devtools/generate-locales"

import { PlasmoExtensionManifestMV2 } from "./mv2"
import { PlasmoExtensionManifestMV3 } from "./mv3"

export async function createManifest(
  commonPath: CommonPath,
  { browser = "chrome", manifestVersion = "mv3" }
) {
  vLog("Making sure .plasmo exists")
  await ensureDir(commonPath.dotPlasmoDirectory)

  await generateIcons(commonPath)
  await generateLocales(commonPath)

  vLog("Creating Extension Manifest...")
  const manifestData =
    manifestVersion === "mv3"
      ? new PlasmoExtensionManifestMV3(commonPath)
      : new PlasmoExtensionManifestMV2(commonPath)

  await manifestData.updateEnv()
  await manifestData.updatePackageData()

  const {
    popupIndexList,
    optionsIndexList,
    contentIndexList,
    newtabIndexList,

    contentsDirectory,
    backgroundIndexList,
    devtoolsIndexList
  } = manifestData.projectPath

  const hasPopup = popupIndexList.some(existsSync)
  const hasOptions = optionsIndexList.some(existsSync)
  const hasDevtools = devtoolsIndexList.some(existsSync)
  const hasNewtab = newtabIndexList.some(existsSync)

  const hasContentsDirectory = existsSync(contentsDirectory)

  const contentIndex = contentIndexList.find(existsSync)
  const backgroundIndex = backgroundIndexList.find(existsSync)

  manifestData
    .togglePopup(hasPopup)
    .toggleOptions(hasOptions)
    .toggleDevtools(hasDevtools)
    .toggleNewtab(hasNewtab)

  await Promise.all([
    manifestData.createPopupScaffolds(),
    manifestData.createOptionsScaffolds(),
    manifestData.createDevtoolsScaffolds(),
    manifestData.createNewtabScaffolds(),
    manifestData.toggleContentScript(contentIndex, true),
    manifestData.toggleBackground(backgroundIndex, true),
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
