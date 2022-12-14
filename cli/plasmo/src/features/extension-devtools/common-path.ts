import { existsSync } from "fs"
import { basename, resolve } from "path"
import { cwd } from "process"

import { getFlagMap } from "~features/helpers/flag"

export const getCommonPath = (projectDirectory = cwd()) => {
  const flagMap = getFlagMap()

  process.env.PLASMO_PROJECT_DIR = projectDirectory

  const packageName = basename(projectDirectory)

  process.env.PLASMO_SRC_PATH = flagMap.srcPath

  const srcDirectory = resolve(projectDirectory, flagMap.srcPath)

  process.env.PLASMO_SRC_DIR = existsSync(srcDirectory)
    ? srcDirectory
    : projectDirectory

  process.env.PLASMO_BUILD_PATH = flagMap.buildPath

  const buildDirectory = resolve(projectDirectory, flagMap.buildPath)

  process.env.PLASMO_BUILD_DIR = buildDirectory

  const distDirectoryName = `${flagMap.target}-${flagMap.tag}`

  const distDirectory = resolve(buildDirectory, distDirectoryName)

  const dotPlasmoDirectory = resolve(projectDirectory, ".plasmo")

  const cacheDirectory = resolve(dotPlasmoDirectory, "cache")

  return {
    packageName,
    projectDirectory,

    buildDirectory,
    distDirectory,
    distDirectoryName,

    sourceDirectory: process.env.PLASMO_SRC_DIR,
    packageFilePath: resolve(projectDirectory, "package.json"),
    gitIgnorePath: resolve(projectDirectory, ".gitignore"),
    assetsDirectory: resolve(projectDirectory, "assets"),

    dotPlasmoDirectory,
    cacheDirectory,

    plasmoVersionFilePath: resolve(cacheDirectory, "plasmo.version.json"),

    staticDirectory: resolve(dotPlasmoDirectory, "static"),
    genAssetsDirectory: resolve(dotPlasmoDirectory, "gen-assets"),
    entryManifestPath: resolve(
      dotPlasmoDirectory,
      `${flagMap.target}.plasmo.manifest.json`
    )
  }
}

export type CommonPath = ReturnType<typeof getCommonPath>
