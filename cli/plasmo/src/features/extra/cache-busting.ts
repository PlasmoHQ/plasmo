import { emptyDir, ensureDir } from "fs-extra"
import { lstat } from "fs/promises"
import { resolve } from "path"

import { isAccessible } from "@plasmo/utils/fs"
import { vLog } from "@plasmo/utils/logging"

import type { CommonPath } from "~features/extension-devtools/common-path"

export async function cleanUpDotPlasmo({
  dotPlasmoDirectory,
  cacheDirectory
}: CommonPath) {
  await emptyDir(dotPlasmoDirectory)
  await ensureDir(cacheDirectory)
}

export async function cleanUpLargeCache(commonPath: CommonPath) {
  const parcelCacheDbFilePath = resolve(
    commonPath.cacheDirectory,
    "parcel",
    "data.mdb"
  )

  const hasCache = await isAccessible(parcelCacheDbFilePath)

  if (!hasCache) {
    return
  }

  const cacheDbFileSize = (await lstat(parcelCacheDbFilePath, { bigint: true }))
    .size

  const sizeInMB = cacheDbFileSize / 1024n ** 2n
  const sizeInGB = Number(sizeInMB) / 1024

  // TODO: calculate the limit based on some heuristic around the size of the project instead of a fixed value.
  const cacheLimitGB = 1.47

  if (sizeInGB > cacheLimitGB) {
    vLog(`Busting large build cache, size: ${sizeInGB.toFixed(2)} GB`)
    await cleanUpDotPlasmo(commonPath)
  }
}
