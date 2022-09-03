import { copy, ensureDir, existsSync } from "fs-extra"
import { resolve } from "path"
import sharp from "sharp"

import { vLog, wLog } from "@plasmo/utils"

import { getMd5RevHash } from "~features/helpers/crypto"

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

// We pick env based icon first, then plain icon
const getPrioritizedIconPaths = (iconNames = baseIconNames) =>
  iconNames
    .map((name) => [`${name}.${process.env.NODE_ENV}.png`, `${name}.png`])
    .flat()

const iconNameList = getPrioritizedIconPaths()

// Use this to cache the path resolving result
const iconState = {
  baseIconPaths: [] as string[],
  baseIconHash: null as string,
  devProvidedIcons: {} as Record<string, string[]>
}

/**
 * optionally handle other icon name variant too like icon-512 or icon-512x512
 * optionally, handle larger icon such as icon-1024 or just icon
 * optionally resolve icon512.${process.env.NODE_ENV}.png as well
  // process.env.NODE_ENV === "development"
 * We stick to png for now
 */
export async function generateIcons({
  assetsDirectory,
  genAssetsDirectory
}: CommonPath) {
  // Precalculate the base icon paths
  if (iconState.baseIconPaths.length === 0) {
    iconState.baseIconPaths = iconNameList.map((name) =>
      resolve(assetsDirectory, name)
    )
  }

  const baseIconPath = iconState.baseIconPaths.find(existsSync)

  if (baseIconPath === undefined) {
    wLog("No icon found in assets directory")
    return
  }

  vLog("Make sure generated assets directory exists")
  await ensureDir(genAssetsDirectory)

  // TODO: hash check the baseIcon to skip this routine?
  vLog(`${baseIconPath} found, create resized icons in gen-assets`)

  const baseIcon = sharp(baseIconPath)
  const baseIconHash = getMd5RevHash(await baseIcon.toBuffer())

  if (iconState.baseIconHash === baseIconHash) {
    vLog("Icon hash matched, skip icon generation")
    return
  }

  iconState.baseIconHash = baseIconHash

  await Promise.all(
    [128, 48, 32, 16].map((width) => {
      // Cache the dev provided icon paths for each width
      if (iconState.devProvidedIcons[width] === undefined) {
        const devIconPath = getPrioritizedIconPaths(getIconNameVariants(width))
        iconState.devProvidedIcons[width] = devIconPath.map((name) =>
          resolve(assetsDirectory, name)
        )
      }

      const devProvidedIcon = iconState.devProvidedIcons[width].find(existsSync)

      const generatedIconPath = resolve(genAssetsDirectory, `icon${width}.png`)

      return devProvidedIcon !== undefined
        ? copy(devProvidedIcon, generatedIconPath)
        : baseIcon.resize({ width, height: width }).toFile(generatedIconPath)
    })
  )
}
