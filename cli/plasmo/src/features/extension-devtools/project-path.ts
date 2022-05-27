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

export const getProjectPath = ({
  currentDirectory: projectDir,
  packageFilePath,
  assetsDirectory
}: CommonPath) => {
  const popupIndexList = [
    resolve(projectDir, "popup.tsx"),
    resolve(projectDir, "popup", "index.tsx")
  ]

  const optionsIndexList = [
    resolve(projectDir, "options.tsx"),
    resolve(projectDir, "options", "index.tsx")
  ]

  const devtoolsIndexList = [
    resolve(projectDir, "devtools.tsx"),
    resolve(projectDir, "devtools", "index.tsx")
  ]

  const envFileList = [
    resolve(projectDir, ".env"),
    resolve(projectDir, ".env.local"),
    resolve(projectDir, ".env.development"),
    resolve(projectDir, ".env.development.local")
  ]

  const contentsIndexPath = resolve(projectDir, "content.ts")
  const backgroundIndexPath = resolve(projectDir, "background.ts")

  const watchPathReasonMap = {
    ...getWatchReasonMap(envFileList, WatchReason.EnvFile),
    ...getWatchReasonMap(popupIndexList, WatchReason.PopupIndex),
    ...getWatchReasonMap(optionsIndexList, WatchReason.OptionsIndex),
    ...getWatchReasonMap(devtoolsIndexList, WatchReason.DevtoolsIndex),

    [backgroundIndexPath]: WatchReason.BackgroundIndex,
    [contentsIndexPath]: WatchReason.ContentsIndex,
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

    contentsIndexPath,
    contentsDirectory
  }
}

export type ProjectPath = ReturnType<typeof getProjectPath>
