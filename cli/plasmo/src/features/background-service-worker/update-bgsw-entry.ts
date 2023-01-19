import { find } from "@plasmo/utils/array"
import { isFileOk } from "@plasmo/utils/fs"

import { createBgswEntry } from "~features/background-service-worker/bgsw-entry"
import { createBgswMessaging } from "~features/background-service-worker/bgsw-messaging"
import type { PlasmoManifest } from "~features/manifest-factory/base"

export const updateBgswEntry = async (plasmoManifest: PlasmoManifest) => {
  const bgswIndex = await find(
    plasmoManifest.projectPath.backgroundIndexList,
    isFileOk
  )

  const withMessaging = await createBgswMessaging(plasmoManifest)

  const hasBgsw = Boolean(bgswIndex || withMessaging)

  if (hasBgsw) {
    await createBgswEntry(
      {
        indexFilePath: bgswIndex,
        withMessaging
      },
      plasmoManifest
    )
  }

  return plasmoManifest.toggleBackground(hasBgsw)
}
