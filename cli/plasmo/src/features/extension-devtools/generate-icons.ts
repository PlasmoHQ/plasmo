import { copy, ensureDir, existsSync } from "fs-extra"
import { basename, resolve } from "path"
import sharp from "sharp"

import { eLog, tag, vLog, wLog } from "@plasmo/utils"

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

const taggedIcons = (name: string) => [`${name}.${tag}.png`, `${name}.${process.env.NODE_ENV}.${tag}.png`]

/**
 * We pick icon in this order
 * 1. tag based icon
 * 2. env and tag based icon
 * 3. plain icon
 * 
 * */ 
const getPrioritizedIconPaths = (iconNames = baseIconNames) =>
  iconNames
    .map((name) => [...(tag?taggedIcons(name):[]), `${name}.${process.env.NODE_ENV}.png`, `${name}.png`])
    .flat()

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

  const baseIconPath = iconState.baseIconPaths.find(existsSync)

  if (baseIconPath === undefined) {
    wLog("No icon found in assets directory")
    return
  }

  await ensureDir(genAssetsDirectory)

  const baseIcon = sharp(baseIconPath)

  vLog(`${baseIconPath} found, creating resized icons`)

  await Promise.all(
    [128, 64, 48, 32, 16].map((width) => {
      if (iconState.devProvidedIcons[width] === undefined) {
        const devIconPath = getPrioritizedIconPaths(getIconNameVariants(width))
        iconState.devProvidedIcons[width] = devIconPath.map((name) =>
          resolve(assetsDirectory, name)
        )
      }

      const devProvidedIcon = iconState.devProvidedIcons[width].find(existsSync)
      const generatedIconPath = resolve(
        genAssetsDirectory,
        `icon${width}.plasmo.png`
      )

      if (process.env.NODE_ENV === "development") {
        if (devProvidedIcon !== undefined) {
          if (basename(devProvidedIcon).includes(".development.") || (tag && basename(devProvidedIcon).includes(tag))) {
            return copy(devProvidedIcon, generatedIconPath)
          } else {
            return sharp(devProvidedIcon).grayscale().toFile(generatedIconPath)
          }
        } else {
          return baseIcon
            .resize({ width, height: width })
            .greyscale(!basename(baseIconPath).includes(".development."))
            .toFile(generatedIconPath)
        }
      } else {
        return devProvidedIcon !== undefined
          ? copy(devProvidedIcon, generatedIconPath)
          : baseIcon.resize({ width, height: width }).toFile(generatedIconPath)
      }
    })
  )
}
