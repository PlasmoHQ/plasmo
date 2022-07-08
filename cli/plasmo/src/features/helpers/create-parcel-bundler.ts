import { Parcel } from "@parcel/core"
import { NodeFS } from "@parcel/fs"
import { NodePackageManager, Npm, Pnpm, Yarn } from "@parcel/package-manager"
import { resolve } from "path"

import type { CommonPath } from "~features/extension-devtools/common-path"

import { getPackageManager } from "./package-manager"

type ParcelOptions = Partial<ConstructorParameters<typeof Parcel>[0]>

const PackageInstallerMap = {
  npm: Npm,
  yarn: Yarn,
  pnpm: Pnpm
}

export const createParcelBuilder = async (
  commonPath: CommonPath,
  options: ParcelOptions
) => {
  const pmInfo = await getPackageManager()

  const inputFS = new NodeFS()

  const PackageInstaller = PackageInstallerMap[pmInfo.name]

  // @ts-ignore - The typing is wrong: https://github.com/parcel-bundler/parcel/pull/8293
  const packageManager = new NodePackageManager(
    inputFS,
    commonPath.currentDirectory,
    // @ts-ignore
    new PackageInstaller()
  )

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
