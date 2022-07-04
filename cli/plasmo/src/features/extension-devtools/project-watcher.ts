import { Event, subscribe } from "@parcel/watcher"

import { PARCEL_WATCHER_BACKEND } from "@plasmo/constants"
import { assertUnreachable, iLog, vLog, wLog } from "@plasmo/utils"

import type { BaseFactory } from "../manifest-factory/base"
import { generateIcons } from "./generate-icons"
import { generateLocales } from "./generate-locales"
import { ProjectPath, WatchReason } from "./project-path"

const ignore = ["node_modules", "build", ".plasmo", "coverage", ".git"]

export const createProjectWatcher = async (
  plasmoManifest: BaseFactory,
  { knownPathSet, watchPathReasonMap, watchDirectoryEntries }: ProjectPath
) => {
  const { default: isPathInside } = await import("is-path-inside")

  vLog("Initialized watch set:", knownPathSet)

  const getWatchReason = (path: string) => {
    // Quick track processing files already inside watch set
    if (knownPathSet.has(path)) {
      return watchPathReasonMap[path]
    }

    const validEntry = watchDirectoryEntries.find(([, dir]) =>
      isPathInside(path, dir)
    )

    if (!validEntry) {
      return WatchReason.None
    }

    // Add new path to the watch set if they are watch directories
    knownPathSet.add(path)
    return (watchPathReasonMap[path] = validEntry[0])
  }

  return subscribe(
    plasmoManifest.commonPath.currentDirectory,
    async (err, events) => {
      if (err) {
        throw err
      }

      await Promise.all(
        events.map(({ path, type }) =>
          handleProjectFile(type, path, getWatchReason(path), plasmoManifest)
        )
      )

      await plasmoManifest.write()
    },
    {
      backend: PARCEL_WATCHER_BACKEND,
      ignore
    }
  )
}

export const handleProjectFile = async (
  type: Event["type"],
  path: string,
  reason: WatchReason,
  plasmoManifest: BaseFactory
) => {
  if (reason === WatchReason.None) {
    return
  }

  switch (reason) {
    case WatchReason.EnvFile: {
      wLog("Environment file change detected, please restart the dev server.")
      return
    }
    case WatchReason.AssetsDirectory: {
      iLog("Assets directory changed, update dynamic assets")
      await generateIcons(plasmoManifest.commonPath)
      await generateLocales(plasmoManifest.commonPath)
      return
    }
    case WatchReason.PackageJson: {
      iLog("package.json changed, update manifest overides")
      await plasmoManifest.updatePackageData()
      return
    }
    case WatchReason.PopupIndex: {
      plasmoManifest.togglePopup(type !== "delete")
      return
    }
    case WatchReason.OptionsIndex: {
      plasmoManifest.toggleOptions(type !== "delete")
      return
    }
    case WatchReason.BackgroundIndex: {
      plasmoManifest.toggleBackground(path, type !== "delete")
      return
    }
    case WatchReason.DevtoolsIndex: {
      plasmoManifest.toggleDevtools(type !== "delete")
      return
    }
    case WatchReason.NewtabIndex: {
      plasmoManifest.toggleNewtab(type !== "delete")
      return
    }
    case WatchReason.ContentsIndex:
    case WatchReason.ContentsDirectory: {
      await plasmoManifest.toggleContentScript(path, type !== "delete")
      return
    }
    default:
      assertUnreachable(reason)
  }
}
