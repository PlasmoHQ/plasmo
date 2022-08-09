import { existsSync } from "fs"
import { resolve } from "path"
import { cwd } from "process"

export const getCommonPath = (
  currentDirectory = cwd(),
  target = "chrome-mv3",
  dotPlasmo = ".plasmo"
) => {
  const srcPath = resolve(currentDirectory, "src")

  return {
    currentDirectory,
    sourceDirectory: existsSync(srcPath) ? srcPath : currentDirectory,
    packageFilePath: resolve(currentDirectory, "package.json"),
    assetsDirectory: resolve(currentDirectory, "assets"),

    buildDirectory: resolve(currentDirectory, "build"),

    dotPlasmoDirectory: resolve(currentDirectory, dotPlasmo),
    cacheDirectory: resolve(currentDirectory, dotPlasmo, "cache"),
    staticDirectory: resolve(currentDirectory, dotPlasmo, "static"),
    genAssetsDirectory: resolve(currentDirectory, dotPlasmo, "gen-assets"),
    entryManifestPath: resolve(
      currentDirectory,
      dotPlasmo,
      `${target}.plasmo.manifest.json`
    )
  }
}

export type CommonPath = ReturnType<typeof getCommonPath>
