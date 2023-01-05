import { existsSync } from "fs"

import { createBgswEntry } from "~features/background-service-worker/bgsw-entry"
import { createBgswMessaging } from "~features/background-service-worker/bgsw-messaging"
import type { PlasmoManifest } from "~features/manifest-factory/base"

export const updateBgswEntry = async (plasmoManifest: PlasmoManifest) => {
  const bgswIndex =
    plasmoManifest.projectPath.backgroundIndexList.find(existsSync)

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
