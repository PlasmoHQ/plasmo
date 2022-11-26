import { resolve } from "path"

import type { SupportedUiExt } from "~features/manifest-factory/ui-library"

import type { CommonPath } from "./common-path"

export enum WatchReason {
  None,

  EnvFile,

  PackageJson,
  AssetsDirectory,

  TabsDirectory,

  BackgroundIndex,
  BackgroundMessagesDirectory,

  ContentScriptIndex,
  ContentScriptsDirectory,

  NewtabIndex,
  NewtabHtml,

  DevtoolsIndex,
  DevtoolsHtml,

  PopupIndex,
  PopupHtml,

  OptionsIndex,
  OptionsHtml,

  SandboxIndex,
  SandboxesDirectory
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
  uiExt: SupportedUiExt
) => {
  /**
   * only pointing to 1 particular file path
   */
  const getModuleList = (moduleName: string) => [
    resolve(sourceDirectory, `${moduleName}.ts`),
    resolve(sourceDirectory, `${moduleName}.${browserTarget}.ts`),
    resolve(sourceDirectory, `${moduleName}${uiExt}`),
    resolve(sourceDirectory, `${moduleName}.${browserTarget}${uiExt}`)
  ]

  /**
   * crawl index, and only care about one extension
   */
  const getIndexList = (moduleName: string, ext = ".ts") => [
    resolve(sourceDirectory, `${moduleName}.${browserTarget}${ext}`),
    resolve(sourceDirectory, moduleName, `index.${browserTarget}${ext}`),
    resolve(sourceDirectory, `${moduleName}${ext}`),
    resolve(sourceDirectory, moduleName, `index${ext}`)
  ]

  const popupIndexList = getIndexList("popup", uiExt)
  const optionsIndexList = getIndexList("options", uiExt)
  const devtoolsIndexList = getIndexList("devtools", uiExt)
  const newtabIndexList = getIndexList("newtab", uiExt)

  const popupHtmlList = getIndexList("popup", ".html")
  const optionsHtmlList = getIndexList("options", ".html")
  const devtoolsHtmlList = getIndexList("devtools", ".html")
  const newtabHtmlList = getIndexList("newtab", ".html")

  const envFileList = [
    resolve(sourceDirectory, ".env"),
    resolve(sourceDirectory, ".env.local"),
    resolve(sourceDirectory, ".env.development"),
    resolve(sourceDirectory, ".env.development.local")
  ]

  const backgroundIndexList = getIndexList("background")

  const contentIndexList = getModuleList("content")
  const sandboxIndexList = getModuleList("sandbox")

  const watchPathReasonMap = {
    [packageFilePath]: WatchReason.PackageJson,

    ...getWatchReasonMap(envFileList, WatchReason.EnvFile),

    ...getWatchReasonMap(contentIndexList, WatchReason.ContentScriptIndex),
    ...getWatchReasonMap(sandboxIndexList, WatchReason.SandboxIndex),

    ...getWatchReasonMap(backgroundIndexList, WatchReason.BackgroundIndex),

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
  const sandboxesDirectory = resolve(sourceDirectory, "sandboxes")
  const tabsDirectory = resolve(sourceDirectory, "tabs")
  const backgroundMessagesDirectory = resolve(
    sourceDirectory,
    "background",
    "messages"
  )

  const watchDirectoryEntries = [
    [WatchReason.SandboxesDirectory, sandboxesDirectory],
    [WatchReason.TabsDirectory, tabsDirectory],
    [WatchReason.ContentScriptsDirectory, contentsDirectory],
    [WatchReason.BackgroundMessagesDirectory, backgroundMessagesDirectory],
    [WatchReason.AssetsDirectory, assetsDirectory]
  ] as Array<DirectoryWatchTuple>

  const knownPathSet = new Set(Object.keys(watchPathReasonMap))

  return {
    popupIndexList,
    popupHtmlList,

    optionsIndexList,
    optionsHtmlList,

    devtoolsIndexList,
    devtoolsHtmlList,

    newtabIndexList,
    newtabHtmlList,

    backgroundIndexList,
    backgroundMessagesDirectory,

    contentIndexList,
    contentsDirectory,

    sandboxIndexList,
    sandboxesDirectory,

    tabsDirectory,

    watchPathReasonMap,
    watchDirectoryEntries,
    knownPathSet
  }
}

export type ProjectPath = ReturnType<typeof getProjectPath>
