import spawnAsync from "@expo/spawn-async"

import { iLog, wLog } from "@plasmo/utils"

import type { PackageManagerInfo } from "~features/helpers/package-manager"

export const installDependencies = async (
  projectDirectory: string,
  packageManager: PackageManagerInfo
) => {
  try {
    iLog("Installing dependencies...")
    await spawnAsync(packageManager.name, ["install"], {
      cwd: projectDirectory,
      stdio: "inherit"
    })
  } catch (error) {
    wLog(error.message)
  }
}
