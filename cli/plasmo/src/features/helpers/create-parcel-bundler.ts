import { dirname, join, resolve } from "path"
import ParcelFS from "@parcel/fs"
import ParcelPM from "@parcel/package-manager"
import { emptyDir, ensureDir, exists, readJson, writeJson } from "fs-extra"

import { getFlag, hasFlag } from "@plasmo/utils/flags"
import { wLog } from "@plasmo/utils/logging"

import { Parcel, type ParcelOptions } from "@plasmohq/parcel-core"

import type { PlasmoManifest } from "~features/manifest-factory/base"

import { getPackageManager } from "./package-manager"

const PackageInstallerMap = {
  npm: ParcelPM.Npm,
  yarn: ParcelPM.Yarn,
  pnpm: ParcelPM.Pnpm
}

export const createParcelBuilder = async (
  { commonPath, bundleConfig, publicEnv }: PlasmoManifest,
  { defaultTargetOptions = {}, ...options }: ParcelOptions
) => {
  const isProd = options.mode === "production"

  if (isProd) {
    await emptyDir(commonPath.distDirectory)
  } else {
    await ensureDir(commonPath.distDirectory)
  }

  process.env.__PLASMO_FRAMEWORK_INTERNAL_NO_MINIFY =
    isProd && hasFlag("--no-minify") ? "true" : "false"

  process.env.__PLASMO_FRAMEWORK_INTERNAL_SOURCE_MAPS = isProd
    ? hasFlag("--inline-source-maps")
      ? "inline"
      : hasFlag("--source-maps")
      ? "external"
      : "none"
    : hasFlag("--no-source-maps")
    ? "none"
    : "inline"

  process.env.__PLASMO_FRAMEWORK_INTERNAL_NO_CS_RELOAD = hasFlag(
    "--no-cs-reload"
  )
    ? "true"
    : "false"

  process.env.__PLASMO_FRAMEWORK_INTERNAL_ES_TARGET =
    (getFlag("--es-target") as any) || "es2022"

  const pmInfo = await getPackageManager()

  const inputFS = new ParcelFS.NodeFS()

  const PackageInstaller = PackageInstallerMap[pmInfo.name]

  const packageManager = new ParcelPM.NodePackageManager(
    inputFS,
    commonPath.projectDirectory,
    new PackageInstaller()
  )

  const baseConfig = require.resolve("@plasmohq/parcel-config")

  let runConfig = join(dirname(baseConfig), "run.json")

  const configJson = await readJson(baseConfig)

  if (hasFlag("--bundle-buddy")) {
    configJson.reporters = ["...", "@parcel/reporter-bundle-buddy"]
  }

  await writeJson(runConfig, configJson)

  if (await exists(commonPath.parcelConfig)) {
    runConfig = commonPath.parcelConfig

    if (isProd) {
      const customConfig = await readJson(runConfig)

      if (customConfig.extends !== "@plasmohq/parcel-config") {
        wLog(
          'The .parcelrc does not extend "@plasmohq/parcel-config", the result may be unexpected'
        )
      }
    }

    if (hasFlag("--bundle-buddy")) {
      wLog(
        'The "--bundle-buddy" flag does not work with a custom .parcelrc file'
      )
    }
  }

  const engines = {
    browsers:
      bundleConfig.manifestVersion === "mv2" &&
      bundleConfig.browser !== "firefox"
        ? ["IE 11"]
        : ["last 1 Chrome version"]
  }

  const bundler = new Parcel({
    inputFS,
    packageManager,
    entries: commonPath.entryManifestPath,
    cacheDir: resolve(commonPath.cacheDirectory, "parcel"),
    config: runConfig,
    shouldAutoInstall: true,

    env: publicEnv.extends(bundleConfig).data,

    defaultTargetOptions: {
      ...defaultTargetOptions,
      engines,
      sourceMaps:
        process.env.__PLASMO_FRAMEWORK_INTERNAL_SOURCE_MAPS !== "none",
      distDir: commonPath.distDirectory
    },

    ...options
  })

  return bundler
}
