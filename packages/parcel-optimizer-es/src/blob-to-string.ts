import { Buffer } from "buffer"
import { Readable } from "stream"

type Blob = Buffer | Readable | string

export function bufferStream(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let buf = Buffer.from([])
    stream.on("data", (data) => {
      buf = Buffer.concat([buf, data])
    })
    stream.on("end", () => {
      resolve(buf)
    })
    stream.on("error", reject)
  })
}

export async function blobToString(blob: Blob): Promise<string> {
  if (typeof blob === "string") {
    return blob
  } else if (blob instanceof Readable) {
    return (await bufferStream(blob)).toString()
  } else if (blob instanceof Buffer) {
    return blob.toString()
  } else {
    return blob
  }
}
