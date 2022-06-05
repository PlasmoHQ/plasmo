import { resolve } from "path"

import type { CommonPath } from "./common-path"

export enum WatchReason {
  None,

  EnvFile,

  PackageJson,
  AssetsDirectory,

  NewtabIndex,

  BackgroundIndex,
  DevtoolsIndex,

  PopupIndex,
  OptionsIndex,

  ContentsIndex,

  ContentsDirectory
}

type DirectoryWatchTuple = [WatchReason, string]

const getWatchReasonMap = (paths: string[], reason: WatchReason) =>
  paths.reduce((output, path) => {
    output[path] = reason
    return output
  }, {}) as Record<string, WatchReason>

const getIndexList = (projectDir: string, moduleName: string, ext = "tsx") => [
  resolve(projectDir, `${moduleName}.${ext}`),
  resolve(projectDir, moduleName, `index.${ext}`)
]

export const getProjectPath = ({
  sourceDirectory: projectDir,
  packageFilePath,
  assetsDirectory
}: CommonPath) => {
  const popupIndexList = getIndexList(projectDir, "popup")
  const optionsIndexList = getIndexList(projectDir, "options")
  const devtoolsIndexList = getIndexList(projectDir, "devtools")
  const newtabIndexList = getIndexList(projectDir, "newtab")

  const envFileList = [
    resolve(projectDir, ".env"),
    resolve(projectDir, ".env.local"),
    resolve(projectDir, ".env.development"),
    resolve(projectDir, ".env.development.local")
  ]

  const contentIndexList = [
    resolve(projectDir, "content.ts"),
    resolve(projectDir, "content.tsx")
  ]
  const backgroundIndexList = getIndexList(projectDir, "background", "ts")

  const watchPathReasonMap = {
    ...getWatchReasonMap(envFileList, WatchReason.EnvFile),
    ...getWatchReasonMap(popupIndexList, WatchReason.PopupIndex),
    ...getWatchReasonMap(optionsIndexList, WatchReason.OptionsIndex),
    ...getWatchReasonMap(devtoolsIndexList, WatchReason.DevtoolsIndex),
    ...getWatchReasonMap(contentIndexList, WatchReason.ContentsIndex),
    ...getWatchReasonMap(contentIndexList, WatchReason.BackgroundIndex),
    ...getWatchReasonMap(newtabIndexList, WatchReason.NewtabIndex),

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

    watchPathReasonMap,
    watchDirectoryEntries,
    knownPathSet,

    backgroundIndexList,

    contentIndexList,
    contentsDirectory
  }
}

export type ProjectPath = ReturnType<typeof getProjectPath>
