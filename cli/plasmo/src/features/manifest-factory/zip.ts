import glob from "fast-glob"
import { AsyncZipDeflate, Zip } from "fflate"
import { createReadStream, createWriteStream } from "fs"
import { resolve } from "path"

import { iLog } from "@plasmo/utils/logging"

import type { CommonPath } from "~features/extension-devtools/common-path"

function toMB(bytes: number) {
  return bytes / 1024 / 1024
}

export const zipBundle = async (
  { distDirectory, buildDirectory, distDirectoryName }: CommonPath,
  withMaps = false
) => {
  const zipFilePath = resolve(buildDirectory, `${distDirectoryName}.zip`)

  const output = createWriteStream(zipFilePath)

  const fileList = await glob(
    [
      "**/*", // Pick all nested files
      !withMaps && "!**/(*.js.map|*.css.map)" // Exclude source maps
    ].filter(Boolean),
    {
      cwd: distDirectory,
      onlyFiles: true
    }
  )

  return new Promise<void>((pResolve, pReject) => {
    let size = 0
    let aborted = false
    const timer = Date.now()
    const zip = new Zip((err, data, final) => {
      if (aborted) {
        return
      } else if (err) {
        pReject(err)
      } else {
        size += data.length
        output.write(data)
        if (final) {
          iLog(
            `Zip Package size: ${toMB(size).toFixed(2)} MB in ${
              Date.now() - timer
            }ms`
          )
          output.end()
          pResolve()
        }
      }
    })

    // Start all the file read streams
    for (const file of fileList) {
      if (aborted) {
        return
      }

      const data = new AsyncZipDeflate(file, {
        level: 9
      })

      zip.add(data)

      const absPath = resolve(distDirectory, file)

      createReadStream(absPath)
        .on("data", (chunk: Buffer) => {
          data.push(chunk, false)
        })
        .on("end", () => {
          data.push(new Uint8Array(0), true) // Notify completion
        })
        .on("error", (error) => {
          aborted = true
          zip.terminate()
          pReject(`Error reading file ${absPath}: ${error.message}`)
        })
    }

    zip.end()
  })
}
