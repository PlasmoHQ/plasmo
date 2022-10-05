import { existsSync } from "fs"
import { basename, resolve } from "path"
import { cwd } from "process"

import { getFlag } from "@plasmo/utils"

import { getBundleConfig } from "./get-bundle-config"

export const getCommonPath = (
  projectDirectory = cwd(),
  { target } = getBundleConfig(),
  dotPlasmo = ".plasmo"
) => {
  const packageName = basename(projectDirectory)

  process.env.PLASMO_SRC_PATH =
    getFlag("--src-path") || process.env.PLASMO_SRC_PATH || "src"

  const srcDirectory = resolve(projectDirectory, process.env.PLASMO_SRC_PATH)

  process.env.PLASMO_SRC_DIR = existsSync(srcDirectory)
    ? srcDirectory
    : projectDirectory

  process.env.PLASMO_BUILD_PATH =
    getFlag("--build-path") || process.env.PLASMO_BUILD_PATH || "build"

  const buildDirectory = resolve(
    projectDirectory,
    process.env.PLASMO_BUILD_PATH
  )

  process.env.PLASMO_BUILD_DIR = buildDirectory

  const distDirectoryName = `${target}-${
    process.env.NODE_ENV === "production" ? "prod" : "dev"
  }`

  const distDirectory = resolve(buildDirectory, distDirectoryName)

  const dotPlasmoDirectory = resolve(projectDirectory, dotPlasmo)

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
      `${target}.plasmo.manifest.json`
    )
  }
}

export type CommonPath = ReturnType<typeof getCommonPath>
