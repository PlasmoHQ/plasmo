import { resolve } from "path"
import { cwd } from "process"

export const getCommonPath = (
  currentDirectory = cwd(),
  dotPlasmo = ".plasmo"
) => ({
  currentDirectory,

  packageFilePath: resolve(currentDirectory, "package.json"),
  assetsDirectory: resolve(currentDirectory, "assets"),

  buildDirectory: resolve(currentDirectory, "build"),

  dotPlasmoDirectory: resolve(currentDirectory, dotPlasmo),
  cacheDirectory: resolve(currentDirectory, dotPlasmo, "cache"),
  staticDirectory: resolve(currentDirectory, dotPlasmo, "static"),
  genAssetsDirectory: resolve(currentDirectory, dotPlasmo, "gen-assets"),
  entryManifestPath: resolve(currentDirectory, dotPlasmo, "manifest.json")
})

export type CommonPath = ReturnType<typeof getCommonPath>
