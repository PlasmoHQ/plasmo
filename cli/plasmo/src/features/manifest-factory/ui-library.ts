import { resolve } from "path"
import semver from "semver"

import { fileExists } from "@plasmo/utils"

import type { BaseFactory } from "./base"

const supportedUILibraries = ["react", "svelte"] as const

type SupportedUILibraryName = typeof supportedUILibraries[number]

const supportedUIExt = [".tsx", ".svelte"] as const

export type SupportedUIExt = typeof supportedUIExt[number]

export type UILibrary = {
  name: SupportedUILibraryName
  path: `${SupportedUILibraryName}${number}`
  version: number
}

const uiLibraryError = `No supported UI library found.  You can file an RFC for a new UI Library here: https://github.com/PlasmoHQ/plasmo/issues`

export const getUILibrary = async (
  plasmoManifest: BaseFactory
): Promise<UILibrary> => {
  const baseLibrary = supportedUILibraries.find(
    (l) => l in plasmoManifest.dependencies
  )

  if (baseLibrary === undefined) {
    throw new Error(uiLibraryError)
  }

  const majorVersion = semver.major(plasmoManifest.dependencies[baseLibrary])

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
