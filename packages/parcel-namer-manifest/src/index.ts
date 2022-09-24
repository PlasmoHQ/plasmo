/**
 * Copyright (c) 2022 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 */
import { Namer } from "@parcel/plugin"

export default new Namer({
  name({ bundle }) {
    const mainEntry = bundle.getMainEntry()
    if (bundle.type === "json") {
      if (
        mainEntry.filePath.endsWith(".plasmo.manifest.json") &&
        mainEntry.meta?.webextEntry
      ) {
        return "manifest.json"
      }

      if (typeof mainEntry.meta?.bundlePath === "string") {
        return mainEntry.meta.bundlePath
      }
    }

    return null
  }
})
