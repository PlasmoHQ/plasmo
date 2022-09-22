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
  }, {} as Record<string, WatchReason>)

export const getProjectPath = (
  { sourceDirectory, packageFilePath, assetsDirectory }: CommonPath,
  browserTarget: string,
  uiExt: SupportedUIExt
) => {
  const getIndexList = (moduleName: string, ext = ".ts") => [
    resolve(sourceDirectory, `${moduleName}.${browserTarget}${ext}`),
    resolve(sourceDirectory, moduleName, `index.${browserTarget}${ext}`),
    resolve(sourceDirectory, `${moduleName}${ext}`),
    resolve(sourceDirectory, moduleName, `index${ext}`)
  ]

  const getOptionalIndexList = (moduleName: string, ext: string | null) =>
    !!ext ? getIndexList(moduleName, ext) : []

  const backgroundIndexList = getIndexList("background")

  const envFileList = [
    resolve(sourceDirectory, ".env"),
    resolve(sourceDirectory, ".env.local"),
    resolve(sourceDirectory, ".env.development"),
    resolve(sourceDirectory, ".env.development.local")
  ]

  const popupHtmlList = getIndexList("popup", ".html")
  const optionsHtmlList = getIndexList("options", ".html")
  const devtoolsHtmlList = getIndexList("devtools", ".html")
  const newtabHtmlList = getIndexList("newtab", ".html")

  const popupIndexList = getOptionalIndexList("popup", uiExt)
  const optionsIndexList = getOptionalIndexList("options", uiExt)
  const devtoolsIndexList = getOptionalIndexList("devtools", uiExt)
  const newtabIndexList = getOptionalIndexList("newtab", uiExt)

  const contentIndexList = [
    resolve(sourceDirectory, "content.ts"),
    resolve(sourceDirectory, `content.${browserTarget}.ts`),
    resolve(sourceDirectory, `content.${uiExt}`),
    resolve(sourceDirectory, `content.${browserTarget}.${uiExt}`)
  ]

  const watchPathReasonMap = {
    [packageFilePath]: WatchReason.PackageJson,

    ...getWatchReasonMap(envFileList, WatchReason.EnvFile),
    ...getWatchReasonMap(backgroundIndexList, WatchReason.BackgroundIndex),

    ...getWatchReasonMap(contentIndexList, WatchReason.ContentsIndex),

    ...getWatchReasonMap(popupIndexList, WatchReason.PopupIndex),
    ...getWatchReasonMap(optionsIndexList, WatchReason.OptionsIndex),
    ...getWatchReasonMap(devtoolsIndexList, WatchReason.DevtoolsIndex),
    ...getWatchReasonMap(newtabIndexList, WatchReason.NewtabIndex),

    ...getWatchReasonMap(popupHtmlList, WatchReason.PopupHtml),
    ...getWatchReasonMap(optionsHtmlList, WatchReason.OptionsHtml),
    ...getWatchReasonMap(devtoolsHtmlList, WatchReason.DevtoolsHtml),
    ...getWatchReasonMap(newtabHtmlList, WatchReason.NewtabHtml)
  }

  const contentsDirectory = resolve(sourceDirectory, "contents")

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
