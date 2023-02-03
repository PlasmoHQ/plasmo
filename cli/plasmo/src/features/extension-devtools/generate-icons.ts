import { copy, ensureDir } from "fs-extra"
import { basename, resolve } from "path"
import sharp from "sharp"

import { find } from "@plasmo/utils/array"
import { isAccessible } from "@plasmo/utils/fs"
import { vLog, wLog } from "@plasmo/utils/logging"

import { getFlagMap } from "~features/helpers/flag"

import type { CommonPath } from "./common-path"

const getIconNameVariants = (size = 512 as string | number, name = "icon") => [
  `${name}${size}`,
  `${name}-${size}`,
  `${name}-${size}x${size}`
]

// Prefer icon -> medium -> large icon
const baseIconNames = [
  "icon",
  ...getIconNameVariants(),
  ...getIconNameVariants(1024)
]

/**
 * We pick icon in this order
 * 1. tag based icon
 * 2. env and tag based icon
 * 3. plain icon
 *
 * */
const getPrioritizedIconPaths = (iconNames = baseIconNames) => {
  const flagMap = getFlagMap()

  return iconNames
    .map((name) => [
      `${name}.${flagMap.tag}.${process.env.NODE_ENV}.png`,
      `${name}.${process.env.NODE_ENV}.png`,
      `${name}.${flagMap.tag}.png`,
      `${name}.png`
    ])
    .flat()
}

const iconSizeList = [128, 64, 48, 32, 16]

// Use this to cache the path resolving result
const iconState = {
  baseIconPaths: [] as string[],
  devProvidedIcons: {} as Record<string, string[]>
}

/**
 * Generate manifest icons from an icon in the assets directory
 * - One icon will be picked in the set { `icon`, `icon512`, `icon-512`, `icon-512x512`, `icon1024`, `icon-1024`, `icon-1024x1024` }
 * - Optionally, it will resolve `process.env.NODE_ENV` suffix, e.g: `icon.development.png`, `icon.production.png`
 * - The suffix is prioritized. Thus, if `icon512.development.png` exists, it will be picked over `icon512.png`
 * - Only png is supported
 */
export async function generateIcons({
  assetsDirectory,
  genAssetsDirectory
}: CommonPath) {
  // Precalculate the base icon paths
  if (iconState.baseIconPaths.length === 0) {
    const iconNameList = getPrioritizedIconPaths()
    iconState.baseIconPaths = iconNameList.map((name) =>
      resolve(assetsDirectory, name)
    )
  }

  const baseIconPath = await find(iconState.baseIconPaths, isAccessible)

  if (baseIconPath === undefined) {
    wLog("No icon found in assets directory")
    return
  }

  await ensureDir(genAssetsDirectory)

  const baseIcon = sharp(baseIconPath)
  const baseIconBuffer = await baseIcon.toBuffer()

  vLog(`${baseIconPath} found, creating resized icons`)

  await Promise.all(
    iconSizeList.map(async (width) => {
      if (iconState.devProvidedIcons[width] === undefined) {
        const devIconPath = getPrioritizedIconPaths(getIconNameVariants(width))
        iconState.devProvidedIcons[width] = devIconPath.map((name) =>
          resolve(assetsDirectory, name)
        )
      }

      const devProvidedIcon = await find(
        iconState.devProvidedIcons[width],
        isAccessible
      )

      const generatedIconPath = resolve(
        genAssetsDirectory,
        `icon${width}.plasmo.png`
      )

      if (process.env.NODE_ENV === "development") {
        if (devProvidedIcon !== undefined) {
          if (basename(devProvidedIcon).includes(".development.")) {
            return copy(devProvidedIcon, generatedIconPath)
          } else {
            return sharp(devProvidedIcon).grayscale().toFile(generatedIconPath)
          }
        } else {
          return sharp(Buffer.from(baseIconBuffer))
            .resize({ width, height: width })
            .greyscale(!basename(baseIconPath).includes(".development."))
            .toFile(generatedIconPath)
        }
      } else {
        return devProvidedIcon !== undefined
          ? copy(devProvidedIcon, generatedIconPath)
          : sharp(Buffer.from(baseIconBuffer))
              .resize({ width, height: width })
              .toFile(generatedIconPath)
      }
    })
  )
}
