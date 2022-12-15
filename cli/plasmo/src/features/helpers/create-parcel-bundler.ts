import { Parcel } from "@parcel/core"
import ParcelFS from "@parcel/fs"
import ParcelPM from "@parcel/package-manager"
import { emptyDir, readJson } from "fs-extra"
import { resolve } from "path"

import type { CommonPath } from "~features/extension-devtools/common-path"

import { getPackageManager } from "./package-manager"

type ParcelOptions = Partial<ConstructorParameters<typeof Parcel>[0]>

const PackageInstallerMap = {
  npm: ParcelPM.Npm,
  yarn: ParcelPM.Yarn,
  pnpm: ParcelPM.Pnpm
}

export const createParcelBuilder = async (
  commonPath: CommonPath,
  options: ParcelOptions
) => {
  await emptyDir(commonPath.distDirectory)

  const pmInfo = await getPackageManager()

  const inputFS = new ParcelFS.NodeFS()

  const PackageInstaller = PackageInstallerMap[pmInfo.name]

  const packageManager = new ParcelPM.NodePackageManager(
    inputFS,
    commonPath.projectDirectory,
    new PackageInstaller()
  )

  const baseConfig = require.resolve("@plasmohq/parcel-config")
  const configJson = await readJson(baseConfig)

  console.log(configJson)

  const bundler = new Parcel({
    inputFS,
    packageManager,
    entries: commonPath.entryManifestPath,
    cacheDir: resolve(commonPath.cacheDirectory, "parcel"),
    config: require.resolve("@plasmohq/parcel-config"),
    shouldAutoInstall: true,
    ...options
  })

  return bundler
}
