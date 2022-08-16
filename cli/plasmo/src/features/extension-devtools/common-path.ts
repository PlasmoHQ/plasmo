import { existsSync } from "fs"
import { basename, resolve } from "path"
import { cwd } from "process"

export const getCommonPath = (
  projectDirectory = cwd(),
  target = "chrome-mv3",
  dotPlasmo = ".plasmo"
) => {
  const packageName = basename(projectDirectory)

  const srcPath = resolve(projectDirectory, "src")

  const buildDirectory = resolve(projectDirectory, "build")

  const distDirectoryName = `${target}-${
    process.env.NODE_ENV === "production" ? "prod" : "dev"
  }`

  const distDirectory = resolve(buildDirectory, distDirectoryName)

  const dotPlasmoDirectory = resolve(projectDirectory, dotPlasmo)

  return {
    packageName,
    projectDirectory,

    buildDirectory,
    distDirectory,
    distDirectoryName,

    sourceDirectory: existsSync(srcPath) ? srcPath : projectDirectory,
    packageFilePath: resolve(projectDirectory, "package.json"),
    gitIgnorePath: resolve(projectDirectory, ".gitignore"),
    assetsDirectory: resolve(projectDirectory, "assets"),

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
