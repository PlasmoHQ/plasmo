import { readJson, writeJson } from "fs-extra"
import semver from "semver"

import { isFileOk } from "@plasmo/utils/fs"
import { vLog } from "@plasmo/utils/logging"

import type { CommonPath } from "~features/extension-devtools/common-path"
import { cleanupDotPlasmo } from "~features/extra/cache-busting"

export const updateVersionFile = async (commonPath: CommonPath) => {
  const { plasmoVersionFilePath } = commonPath

  if (!(await isFileOk(plasmoVersionFilePath))) {
    vLog("Plasmo version file not found, busting cache...")
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
      vLog("Plasmo version outdated, busting cache...")
      await cleanupDotPlasmo(commonPath)
    }
  }

  await writeJson(plasmoVersionFilePath, { version: process.env.APP_VERSION })
}
