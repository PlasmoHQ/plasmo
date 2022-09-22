import { readJson } from "fs-extra"
import { resolve } from "path"
import { cwd } from "process"
import semver from "semver"

import { fileExists } from "@plasmo/utils"

import type { BaseFactory } from "./base"

const supportedUILibraries = ["react", "svelte", "vue", "vanilla"] as const

type SupportedUILibraryName = typeof supportedUILibraries[number]

const supportedUIExt = [".ts", ".tsx", ".svelte", ".vue"] as const

export type SupportedUIExt = typeof supportedUIExt[number]

export type UILibrary = {
  name: SupportedUILibraryName
  path: `${SupportedUILibraryName}${number | ""}`
  version: number
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

export const getUILibrary = async (
  plasmoManifest: BaseFactory
): Promise<UILibrary> => {
  const dependencies = plasmoManifest.dependencies ?? {}

  const baseLibrary = supportedUILibraries.find((l) => l in dependencies)

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
