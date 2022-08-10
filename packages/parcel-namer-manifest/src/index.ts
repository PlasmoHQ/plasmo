/**
 * Copyright (c) 2022 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 */
import { Namer } from "@parcel/plugin"

export default new Namer({
  name({ bundle }) {
    if (bundle.type === "json" && bundle.getMainEntry().meta?.webextEntry) {
      return "manifest.json"
    }

    return null
  }
})
