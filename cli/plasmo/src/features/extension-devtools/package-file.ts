import { sentenceCase } from "change-case"
import { userInfo } from "os"
import getPackageJson, { AbbreviatedVersion } from "package-json"

import type { ExtensionManifestV3 } from "@plasmo/constants"

import type { PackageManagerInfo } from "~features/helpers/package-manager"

export const generatePackage = ({
  name = "plasmo-extension",
  version = "0.0.0",
  packageManager = {} as PackageManagerInfo
}) => {
  const baseData = {
    name,
    displayName: sentenceCase(name),
    version,
    description: "A basic Plasmo extension.",
    author: userInfo().username,

    packageManager: undefined as string | undefined,
    scripts: {
      dev: "plasmo dev",
      build: "plasmo build"
    },
    dependencies: {
      plasmo: process.env.APP_VERSION,
      react: "18.2.0",
      "react-dom": "18.2.0"
    } as Record<string, string>,
    devDependencies: {
      "@plasmohq/prettier-plugin-sort-imports": "1.2.2",
      "@types/chrome": "0.0.196",
      "@types/node": "18.7.15",
      "@types/react": "18.0.18",
      "@types/react-dom": "18.0.6",
      prettier: "2.7.1",
      typescript: "4.8.2"
    } as Record<string, string>,
    manifest: {
      // permissions: [] as ValidManifestPermission[],
      host_permissions: ["https://*/*"]
    } as Partial<ExtensionManifestV3>
  }

  if (!packageManager || !packageManager.version) {
    delete baseData.packageManager
  } else {
    baseData.packageManager = `${packageManager.name}@${packageManager.version}`
  }

  return baseData
}

export type PackageJSON = ReturnType<typeof generatePackage> & {
  homepage?: string
  contributors?: string[]
}

export const resolveWorkspaceToLatestSemver = async (
  dependencies: Record<string, string>
) => {
  const output = {} as Record<string, string>

  await Promise.all(
    Object.entries(dependencies).map(async ([key, value]) => {
      if (key === "plasmo") {
        output[key] = process.env.APP_VERSION as string
      } else if (value === "workspace:*") {
        const remotePackageData = (await getPackageJson(key, {
          version: "latest"
        })) as unknown as AbbreviatedVersion
        output[key] = remotePackageData.version
      } else {
        output[key] = value
      }
    })
  )

  return output
}
