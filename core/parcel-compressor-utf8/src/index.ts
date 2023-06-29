/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 */
import { Compressor } from "@parcel/plugin"

import { Utf8Transform } from "./utf8-transform"

export default new Compressor({
  async compress({ stream }) {
    return {
      stream: stream.pipe(new Utf8Transform())
    }
  }
})
