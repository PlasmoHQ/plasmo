import { createWriteStream } from "fs"
import { resolve } from "path"

import { iLog } from "@plasmo/utils/logging"

import type { CommonPath } from "~features/extension-devtools/common-path"

export const zipBundle = async ({
  distDirectory,
  buildDirectory,
  distDirectoryName
}: CommonPath) => {
  const { default: archiver } = await import("archiver")
  const zipClient = archiver("zip", {
    zlib: { level: 9 }
  })

  const zipFilePath = resolve(buildDirectory, `${distDirectoryName}.zip`)

  const output = createWriteStream(zipFilePath)
  output.on("close", () => {
    iLog(`Zip Package size: ${zipClient.pointer()} bytes`)
  })

  zipClient.pipe(output)

  zipClient.directory(distDirectory, "")

  await zipClient.finalize()
}
