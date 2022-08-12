import { existsSync } from "fs"
import { resolve } from "path"
import { cwd } from "process"

export const getCommonPath = (
  currentDirectory = cwd(),
  target = "chrome-mv3",
  dotPlasmo = ".plasmo"
) => {
  const srcPath = resolve(currentDirectory, "src")

  const buildDirectory = resolve(currentDirectory, "build")

  const distDirectoryName = `${target}-${
    process.env.NODE_ENV === "production" ? "prod" : "dev"
  }`

  const distDirectory = resolve(buildDirectory, distDirectoryName)

  const dotPlasmoDirectory = resolve(currentDirectory, dotPlasmo)
  return {
    currentDirectory,
    buildDirectory,
    distDirectory,
    distDirectoryName,

    sourceDirectory: existsSync(srcPath) ? srcPath : currentDirectory,
    packageFilePath: resolve(currentDirectory, "package.json"),
    assetsDirectory: resolve(currentDirectory, "assets"),

    dotPlasmoDirectory,
    cacheDirectory: resolve(dotPlasmoDirectory, "cache"),
    staticDirectory: resolve(dotPlasmoDirectory, "static"),
    genAssetsDirectory: resolve(dotPlasmoDirectory, "gen-assets"),
    entryManifestPath: resolve(
      dotPlasmoDirectory,
      `${target}.plasmo.manifest.json`
    )
  }
}

export type CommonPath = ReturnType<typeof getCommonPath>
