import { resolve } from "path"

import type { SupportedUIExt } from "~features/manifest-factory/ui-library"

import type { CommonPath } from "./common-path"

export enum WatchReason {
  None,

  EnvFile,

  PackageJson,
  AssetsDirectory,

  BackgroundIndex,

  ContentsIndex,
  ContentsDirectory,

  NewtabIndex,
  DevtoolsIndex,
  PopupIndex,
  OptionsIndex,

  NewtabHtml,
  DevtoolsHtml,
  PopupHtml,
  OptionsHtml
}

type DirectoryWatchTuple = [WatchReason, string]

const getWatchReasonMap = (paths: string[], reason: WatchReason) =>
  paths.reduce((output, path) => {
    output[path] = reason
    return output
  }, {}) as Record<string, WatchReason>

const getIndexList = (projectDir: string, moduleName: string, ext = ".ts") => [
  resolve(projectDir, `${moduleName}${ext}`),
  resolve(projectDir, moduleName, `index${ext}`)
]

export const getProjectPath = (
  { sourceDirectory: projectDir, packageFilePath, assetsDirectory }: CommonPath,
  uiExt: SupportedUIExt
) => {
  const popupIndexList = getIndexList(projectDir, "popup", uiExt)
  const optionsIndexList = getIndexList(projectDir, "options", uiExt)
  const devtoolsIndexList = getIndexList(projectDir, "devtools", uiExt)
  const newtabIndexList = getIndexList(projectDir, "newtab", uiExt)

  const popupHtmlList = getIndexList(projectDir, "popup", ".html")
  const optionsHtmlList = getIndexList(projectDir, "options", ".html")
  const devtoolsHtmlList = getIndexList(projectDir, "devtools", ".html")
  const newtabHtmlList = getIndexList(projectDir, "newtab", ".html")

  const envFileList = [
    resolve(projectDir, ".env"),
    resolve(projectDir, ".env.local"),
    resolve(projectDir, ".env.development"),
    resolve(projectDir, ".env.development.local")
  ]

  const contentIndexList = [
    resolve(projectDir, "content.ts"),
    resolve(projectDir, `content${uiExt}`)
  ]
  const backgroundIndexList = getIndexList(projectDir, "background")

  const watchPathReasonMap = {
    ...getWatchReasonMap(envFileList, WatchReason.EnvFile),
    ...getWatchReasonMap(contentIndexList, WatchReason.ContentsIndex),
    ...getWatchReasonMap(backgroundIndexList, WatchReason.BackgroundIndex),

    ...getWatchReasonMap(popupIndexList, WatchReason.PopupIndex),
    ...getWatchReasonMap(optionsIndexList, WatchReason.OptionsIndex),
    ...getWatchReasonMap(devtoolsIndexList, WatchReason.DevtoolsIndex),
    ...getWatchReasonMap(newtabIndexList, WatchReason.NewtabIndex),

    ...getWatchReasonMap(popupHtmlList, WatchReason.PopupHtml),
    ...getWatchReasonMap(optionsHtmlList, WatchReason.OptionsHtml),
    ...getWatchReasonMap(devtoolsHtmlList, WatchReason.DevtoolsHtml),
    ...getWatchReasonMap(newtabHtmlList, WatchReason.NewtabHtml),

    [packageFilePath]: WatchReason.PackageJson
  }

  const contentsDirectory = resolve(projectDir, "contents")

  const watchDirectoryEntries = [
    [WatchReason.ContentsDirectory, contentsDirectory],
    [WatchReason.AssetsDirectory, assetsDirectory]
  ] as Array<DirectoryWatchTuple>

  const knownPathSet = new Set(Object.keys(watchPathReasonMap))

  return {
    popupIndexList,
    optionsIndexList,
    devtoolsIndexList,
    newtabIndexList,

    popupHtmlList,
    optionsHtmlList,
    devtoolsHtmlList,
    newtabHtmlList,

    backgroundIndexList,
    contentIndexList,
    contentsDirectory,

    watchPathReasonMap,
    watchDirectoryEntries,
    knownPathSet
  }
}

export type ProjectPath = ReturnType<typeof getProjectPath>
