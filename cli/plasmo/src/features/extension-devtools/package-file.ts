import { sentenceCase } from "change-case"
import { userInfo } from "os"

import type { ExtensionManifest } from "@plasmo/constants"

import type { PackageManagerInfo } from "~features/helpers/package-manager"

export const generatePackage = ({
  name = "plasmo-extension",
  version = "0.0.0",
  packageManager = null as PackageManagerInfo
}) => {
  const baseData = {
    name,
    displayName: sentenceCase(name),
    version,
    description: "A basic Plasmo extension.",
    author: userInfo().username,

    packageManager: "",
    scripts: {
      dev: "plasmo dev",
      build: "plasmo build"
    },
    dependencies: {
      plasmo: "latest",
      react: "18.2.0",
      "react-dom": "18.2.0"
    } as Record<string, string>,
    devDependencies: {
      "@trivago/prettier-plugin-sort-imports": "3.2.0",
      "@types/chrome": "0.0.191",
      "@types/node": "18.0.0",
      "@types/react": "18.0.14",
      "@types/react-dom": "18.0.5",
      prettier: "2.7.1",
      typescript: "4.7.4"
    },
    manifest: {
      // permissions: [] as ValidManifestPermission[],
      host_permissions: ["https://*/*"]
    } as ExtensionManifest
  }

  if (!packageManager || !packageManager.version) {
    delete baseData.packageManager
  } else {
    baseData.packageManager = `${packageManager.name}@${packageManager.version}`
  }

  return baseData
}

export type PackageJSON = ReturnType<typeof generatePackage>
