import { copy, ensureDir, existsSync } from "fs-extra"
import { resolve } from "path"
import sharp from "sharp"

import { vLog } from "@plasmo/utils"

import type { CommonPath } from "./common-path"

export async function generateIcons(
  { assetsDirectory, genAssetsDirectory }: CommonPath,
  iconName = process.env.NODE_ENV === "development"
    ? "icon512.development.png"
    : "icon512.png"
) {
  let image512Path = resolve(assetsDirectory, iconName)
  image512Path = existsSync(image512Path)
    ? image512Path
    : resolve(assetsDirectory, "icon512.png")

  if (existsSync(image512Path)) {
    vLog("Make sure generated assets directory exists")
    await ensureDir(genAssetsDirectory)

    // TODO: hash check the image512 to skip this routine
    vLog(`${iconName} found, create resized icons in gen-assets`)

    const image512 = sharp(image512Path)
    await Promise.all(
      [128, 48, 16].map((width) => {
        const iconFileName = `icon${width}.png`
        const developerProvidedImagePath = resolve(
          assetsDirectory,
          iconFileName
        )

        const generatedIconPath = resolve(genAssetsDirectory, iconFileName)

        return existsSync(developerProvidedImagePath)
          ? copy(developerProvidedImagePath, generatedIconPath)
          : image512.resize({ width, height: width }).toFile(generatedIconPath)
      })
    )
  }
}
