import { readJson } from "fs-extra"
import { resolve } from "path"
import { cwd } from "process"
import semver from "semver"

import { assertUnreachable } from "@plasmo/utils/assert"
import { fileExists } from "@plasmo/utils/fs"

import type { PlasmoManifest } from "./base"

const supportedUiLibraries = ["react", "svelte", "vue", "vanilla"] as const

type SupportedUiLibraryName = typeof supportedUiLibraries[number]

const supportedUiExt = [".tsx", ".svelte", ".vue", ".js", ".jsx"] as const

export type SupportedUiExt = typeof supportedUiExt[number]

const supportedUiExtSet = new Set(supportedUiExt)

export const isSupportedUiExt = (ext: string): ext is SupportedUiExt =>
  supportedUiExtSet.has(ext as SupportedUiExt)

export type UiLibrary = {
  name: SupportedUiLibraryName
  path: `${SupportedUiLibraryName}${number | ""}`
  version: number
}

const supportedMountExt = [".ts", ".tsx"] as const

export type ScaffolderMountExt = typeof supportedMountExt[number]

export type UiExtMap = {
  uiExts: SupportedUiExt[]
  mountExt: ScaffolderMountExt
}

const uiLibraryError = `No supported UI library found.  You can file an RFC for a new UI Library here: https://github.com/PlasmoHQ/plasmo/issues`

const getMajorVersion = async (version: string) => {
  if (version.includes(":")) {
    const [protocol, versionData] = version.split(":")
    switch (protocol) {
      case "file":
      default:
        const packageJson = await readJson(
          resolve(cwd(), versionData, "package.json")
        )
        return semver.coerce(packageJson.version)?.major
    }
  } else {
    return semver.coerce(version)?.major
  }
}

export const getUiLibrary = async (
  plasmoManifest: PlasmoManifest
): Promise<UiLibrary> => {
  const dependencies = plasmoManifest.dependencies ?? {}

  const baseLibrary = supportedUiLibraries.find((l) => l in dependencies)

  if (baseLibrary === undefined) {
    return {
      name: "vanilla",
      path: "vanilla",
      version: 8427
    }
  }

  const majorVersion = await getMajorVersion(dependencies[baseLibrary])

  if (majorVersion === undefined) {
    throw new Error(uiLibraryError)
  }

  // React lower than 18 can uses 17 scaffold
  if (baseLibrary === "react" && majorVersion < 18) {
    return {
      name: baseLibrary,
      path: "react17",
      version: majorVersion
    }
  }

  const uiLibraryPath = `${baseLibrary}${majorVersion}` as const

  const staticPath = resolve(
    plasmoManifest.templatePath.staticTemplatePath,
    uiLibraryPath
  )

  if (!(await fileExists(staticPath))) {
    throw new Error(uiLibraryError)
  }

  return {
    name: baseLibrary,
    path: uiLibraryPath,
    version: majorVersion
  }
}

export const getUiExtMap = (
  uiLibraryName: SupportedUiLibraryName
): UiExtMap => {
  switch (uiLibraryName) {
    case "svelte":
      return {
        uiExts: [".svelte"],
        mountExt: ".ts"
      }
    case "vue":
      return {
        uiExts: [".vue"],
        mountExt: ".ts"
      }
    case "react":
      return {
        uiExts: [".tsx", ".js", ".jsx"],
        mountExt: ".tsx"
      }
    case "vanilla":
      return {
        uiExts: [".tsx", ".js", ".jsx"],
        mountExt: ".ts"
      }
    default:
      assertUnreachable(uiLibraryName)
  }
}
