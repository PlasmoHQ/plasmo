import { existsSync } from "fs"
import { mkdir } from "fs/promises"

import { dryRun, isFolderEmpty, isWriteable, vLog } from "@plasmo/utils"

export async function ensureNonEmptyAndWritable(projectDirectory: string) {
  if (!existsSync(projectDirectory)) {
    vLog("Directory does not exist, creating...")
    if (!dryRun) {
      await mkdir(projectDirectory)
    }
  } else {
    vLog("Directory exists, checking if it is empty")

    if (!(await isFolderEmpty(projectDirectory))) {
      throw new Error(`Directory ${projectDirectory} is not empty.`)
    }

    if (!(await isWriteable(projectDirectory))) {
      throw new Error(`Directory ${projectDirectory} is not accesible.`)
    }
  }
}
