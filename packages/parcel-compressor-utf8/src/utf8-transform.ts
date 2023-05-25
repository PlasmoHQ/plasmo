/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 */

import { Transform, type TransformCallback } from "stream"

class Utf8Transform extends Transform {
  _transform(chunk: Buffer, _: BufferEncoding, callback: TransformCallback) {
    const str = chunk.toString()
    let result = ""
    for (let i = 0; i < chunk.length; i++) {
      let ch = str.charAt(i)
      result +=
        ch.charCodeAt(0) <= 0x7f
          ? ch
          : "\\u" + ("0000" + ch.charCodeAt(0).toString(16)).slice(-4)
    }
    callback(null, result)
  }
}

export { Utf8Transform }
