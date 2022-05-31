import { resolve } from "path"

import type { CommonPath } from "./common-path"

export enum WatchReason {
  None,

  EnvFile,

  PackageJson,
  AssetsDirectory,

  BackgroundIndex,
  DevtoolsIndex,

  PopupIndex,
  PopupDirectory,

  OptionsIndex,
  OptionsDirectory,

  ContentsIndex,
  ContentsDirectory
}

type DirectoryWatchTuple = [WatchReason, string]

const getWatchReasonMap = (paths: string[], reason: WatchReason) =>
  paths.reduce((output, path) => {
    output[path] = reason
    return output
  }, {}) as Record<string, WatchReason>

const getTSXIndexList = (projectDir: string, moduleName: string) => [
  resolve(projectDir, `${moduleName}.tsx`),
  resolve(projectDir, moduleName, "index.tsx")
]

export const getProjectPath = ({
  sourceDirectory: projectDir,
  packageFilePath,
  assetsDirectory
}: CommonPath) => {
  const popupIndexList = getTSXIndexList(projectDir, "popup")
  const optionsIndexList = getTSXIndexList(projectDir, "options")
  const devtoolsIndexList = getTSXIndexList(projectDir, "devtools")

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
  const backgroundIndexPath = resolve(projectDir, "background.ts")

  const watchPathReasonMap = {
    ...getWatchReasonMap(envFileList, WatchReason.EnvFile),
    ...getWatchReasonMap(popupIndexList, WatchReason.PopupIndex),
    ...getWatchReasonMap(optionsIndexList, WatchReason.OptionsIndex),
    ...getWatchReasonMap(devtoolsIndexList, WatchReason.DevtoolsIndex),
    ...getWatchReasonMap(contentIndexList, WatchReason.ContentsIndex),

    [backgroundIndexPath]: WatchReason.BackgroundIndex,
    [packageFilePath]: WatchReason.PackageJson
  }

  const contentsDirectory = resolve(projectDir, "contents")

  const watchDirectoryEntries = [
    [WatchReason.ContentsDirectory, contentsDirectory],
    [WatchReason.OptionsDirectory, resolve(projectDir, "options")],
    [WatchReason.PopupDirectory, resolve(projectDir, "popup")],
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

    backgroundIndexPath,

    contentIndexList,
    contentsDirectory
  }
}

export type ProjectPath = ReturnType<typeof getProjectPath>
