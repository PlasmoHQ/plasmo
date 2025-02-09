/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 */
import { Transform, type TransformCallback } from "stream"
import { StringDecoder } from "string_decoder"

class Utf8Transform extends Transform {
  private decoder = new StringDecoder("utf8")

  _transform(chunk: Buffer, _: BufferEncoding, callback: TransformCallback) {
    callback(null, this.transformChunk(this.decoder.write(chunk)))
  }

  _flush(callback: TransformCallback) {
    const remainder = this.decoder.end()
    remainder ? callback(null, this.transformChunk(remainder)) : callback()
  }

  private transformChunk(chunk: string, segmentSize: number = 1024): string {
    let result = ""
    for (let i = 0; i < chunk.length; i += segmentSize) {
      const endIndex = Math.min(i + segmentSize, chunk.length)
      const segment = chunk.substring(i, endIndex)
      result += this.transformSegment(segment)
    }
    return result
  }

  private transformSegment(segment: string): string {
    return Array.from(segment)
      .map((ch) =>
        ch.charCodeAt(0) <= 0x7f
          ? ch
          : "\\u" + ("0000" + ch.charCodeAt(0).toString(16)).slice(-4)
      )
      .join("")
  }
}

export { Utf8Transform }
