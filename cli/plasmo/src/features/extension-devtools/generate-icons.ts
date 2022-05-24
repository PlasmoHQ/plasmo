import { ensureDir, existsSync } from "fs-extra"
import { resolve } from "path"

import { vLog } from "@plasmo/utils"

import type { CommonPath } from "./common-paths"

export async function generateIcons(
  { assetsDirectory, genAssetsDirectory }: CommonPath,
  iconName = "icon512.png"
) {
  const image512Path = resolve(assetsDirectory, iconName)

  if (existsSync(image512Path)) {
    vLog("Make sure generated assets directory exists")
    await ensureDir(genAssetsDirectory)

    // TODO: hash check the image512 to skip this routine
    vLog(`${iconName} found, create resized icons in gen-assets`)
    const { Image } = await import("image-js")

    const image512 = await Image.load(image512Path)
    await Promise.all(
      [128, 48, 16].map((width) =>
        image512
          .resize({ width })
          .save(resolve(genAssetsDirectory, `icon${width}.png`))
      )
    )
  }
}
