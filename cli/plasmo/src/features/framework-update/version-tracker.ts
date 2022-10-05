import { existsSync } from "fs"
import { emptyDir, ensureDir, readJson, writeJson } from "fs-extra"
import semver from "semver"

import { wLog } from "@plasmo/utils"

import type { CommonPath } from "~features/extension-devtools/common-path"

export const updateVersionFile = async (commonPath: CommonPath) => {
  const { plasmoVersionFilePath } = commonPath

  if (!existsSync(plasmoVersionFilePath)) {
    wLog("Plasmo version file not found, busting cache...")
    await cleanupDotPlasmo(commonPath)
  } else {
    const cachedVersion = await readJson(plasmoVersionFilePath)
    const semverCachedVersion = semver.coerce(cachedVersion.version)
    const semverCurrentVersion = semver.coerce(process.env.APP_VERSION)!

    if (
      !semverCachedVersion ||
      semverCachedVersion.major < semverCurrentVersion.major ||
      (semverCachedVersion.major === semverCurrentVersion.major &&
        semverCachedVersion.minor < semverCurrentVersion.minor)
    ) {
      wLog("Plasmo version outdated, busting cache...")
      await cleanupDotPlasmo(commonPath)
    }
  }

  await writeJson(plasmoVersionFilePath, { version: process.env.APP_VERSION })
}

async function cleanupDotPlasmo({
  dotPlasmoDirectory,
  cacheDirectory
}: CommonPath) {
  await emptyDir(dotPlasmoDirectory)
  await ensureDir(cacheDirectory)
}
