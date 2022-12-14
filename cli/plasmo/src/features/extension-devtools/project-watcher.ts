import { Event, subscribe } from "@parcel/watcher"

import { PARCEL_WATCHER_BACKEND } from "@plasmo/constants/misc"
import { assertUnreachable } from "@plasmo/utils/assert"
import { hasFlag } from "@plasmo/utils/flags"
import { iLog, vLog, wLog } from "@plasmo/utils/logging"

import { updateBgswEntry } from "~features/background-service-worker/update-bgsw-entry"
import type { BaseFactory } from "~features/manifest-factory/base"

import { generateIcons } from "./generate-icons"
import { WatchReason } from "./project-path"

const ignore = ["node_modules", "build", ".plasmo", "coverage", ".git"]

export const createProjectWatcher = async (plasmoManifest: BaseFactory) => {
  if (hasFlag("--impulse")) {
    return null
  }

  const { default: isPathInside } = await import("is-path-inside")

  const { knownPathSet, watchPathReasonMap, watchDirectoryEntries } =
    plasmoManifest.projectPath

  vLog("Watching the following files:", knownPathSet)

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
    plasmoManifest.commonPath.projectDirectory,
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
  const isEnabled = type !== "delete"

  switch (reason) {
    case WatchReason.None: {
      return
    }
    case WatchReason.EnvFile: {
      wLog("Environment file change detected, please restart the dev server.")
      return
    }
    case WatchReason.AssetsDirectory: {
      iLog("Assets directory changed, update dynamic assets")
      await generateIcons(plasmoManifest.commonPath)
      return
    }
    case WatchReason.PackageJson: {
      iLog(
        "package.json changed, updating manifest overides. You might need to restart the dev server."
      )
      await plasmoManifest.updatePackageData()
      return
    }
    case WatchReason.BackgroundDirectory:
    case WatchReason.BackgroundIndex: {
      await updateBgswEntry(plasmoManifest)
      return
    }
    case WatchReason.ContentScriptIndex:
    case WatchReason.ContentScriptsDirectory: {
      await plasmoManifest.toggleContentScript(path, isEnabled)
      return
    }

    case WatchReason.SandboxIndex:
    case WatchReason.SandboxesDirectory:
    case WatchReason.TabsDirectory: {
      await plasmoManifest.togglePage(path, isEnabled)
      return
    }

    case WatchReason.PopupIndex: {
      plasmoManifest.togglePopup(isEnabled)
      return
    }
    case WatchReason.OptionsIndex: {
      plasmoManifest.toggleOptions(isEnabled)
      return
    }
    case WatchReason.DevtoolsIndex: {
      plasmoManifest.toggleDevtools(isEnabled)
      return
    }
    case WatchReason.NewtabIndex: {
      plasmoManifest.toggleNewtab(isEnabled)
      return
    }

    case WatchReason.PopupHtml: {
      await plasmoManifest.scaffolder.createPageHtml("popup", isEnabled && path)
      return
    }
    case WatchReason.OptionsHtml: {
      await plasmoManifest.scaffolder.createPageHtml(
        "options",
        isEnabled && path
      )
      return
    }
    case WatchReason.DevtoolsHtml: {
      await plasmoManifest.scaffolder.createPageHtml(
        "devtools",
        isEnabled && path
      )
      return
    }
    case WatchReason.NewtabHtml: {
      await plasmoManifest.scaffolder.createPageHtml(
        "newtab",
        isEnabled && path
      )
      return
    }

    default:
      assertUnreachable(reason)
  }
}
