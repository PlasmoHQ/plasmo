import { emptyDir, ensureDir } from "fs-extra"
import { lstat } from "fs/promises"
import { resolve } from "path"

import { vLog } from "@plasmo/utils/logging"

import type { CommonPath } from "~features/extension-devtools/common-path"

export async function cleanupDotPlasmo({
  dotPlasmoDirectory,
  cacheDirectory
}: CommonPath) {
  await emptyDir(dotPlasmoDirectory)
  await ensureDir(cacheDirectory)
}

export async function cleanupLargeCache(commonPath: CommonPath) {
  const parcelCacheDbFilePath = resolve(
    commonPath.cacheDirectory,
    "parcel",
    "data.mdb"
  )
  const cacheDbFileSize = (await lstat(parcelCacheDbFilePath, { bigint: true }))
    .size

  // get size in MB
  const sizeInMB = cacheDbFileSize / 1024n ** 2n
  const sizeInGB = Number(sizeInMB) / 1024

  // TODO: calculate the limit based on some heuristic around the size of the project instead of a fixed value
  const cacheLimit = 1.47

  if (sizeInGB > cacheLimit) {
    vLog(`Busting large build cache, size: ${sizeInGB.toFixed(2)}GB`)
    await cleanupDotPlasmo(commonPath)
  }
}
