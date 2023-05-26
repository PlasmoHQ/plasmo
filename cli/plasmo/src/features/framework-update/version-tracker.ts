import { readJson, writeJson } from "fs-extra"
import getPackageJson, { type AbbreviatedVersion } from "package-json"
import semver from "semver"

import { isAccessible } from "@plasmo/utils/fs"
import { aLog, eLog, vLog, wLog } from "@plasmo/utils/logging"

import type { CommonPath } from "~features/extension-devtools/common-path"
import { cleanUpDotPlasmo } from "~features/extra/cache-busting"
import { getPackageManager } from "~features/helpers/package-manager"

export const updateVersionFile = async (commonPath: CommonPath) => {
  const { plasmoVersionFilePath } = commonPath

  if (!(await isAccessible(plasmoVersionFilePath))) {
    vLog("Plasmo version file not found, busting cache...")
    await cleanUpDotPlasmo(commonPath)
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
      vLog("Plasmo updated, busting cache...")
      await cleanUpDotPlasmo(commonPath)
    }
  }

  await writeJson(plasmoVersionFilePath, { version: process.env.APP_VERSION })
}

export const checkNewVersion = async () => {
  // If the version is different, log a warning about new version is available
  const currentVersion = process.env.APP_VERSION

  // If the version is different, log a warning about new version is available
  try {
    // Get the latest version of plasmo
    const latestPackageJson = (await getPackageJson("plasmo", {
      version: "latest"
    })) as unknown as AbbreviatedVersion
    const latestVersion = latestPackageJson.version

    // If the version is different, log a warning about new version is available
    if (semver.lt(currentVersion, latestVersion)) {
      const { default: chalk } = await import("chalk")
      wLog(
        chalk.yellowBright(
          `A new version of plasmo is available: v${latestVersion}`
        )
      )
      const updateCmd = await getUpdateCmd(latestVersion)
      aLog(chalk.yellow(`Run ${updateCmd} to update`))
    }
  } catch (error) {
    eLog('Error fetching package information for "plasmo"', error)
  }
}

async function getUpdateCmd(version = "") {
  const packageManager = await getPackageManager()
  switch (packageManager.name) {
    case "npm":
      return `"npm i -S plasmo@${version}"`
    case "pnpm":
      return `"pnpm i plasmo@${version}"`
    case "yarn":
      return `"yarn add plasmo@${version}"`
  }
}
