/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 */

import { Transform, type TransformCallback } from "stream"
import { StringDecoder } from "string_decoder"

class Utf8Transform extends Transform {
  private decoder = new StringDecoder("utf8")

  _transform(chunk: Buffer, _: BufferEncoding, callback: TransformCallback) {
    const str = this.decoder.write(chunk)
    callback(null, str)
  }

  _flush(callback: TransformCallback) {
    const remainder = this.decoder.end()
    if (remainder) {
      callback(null, remainder)
    } else {
      callback()
    }
  }
}

export { Utf8Transform }
