import spawnAsync, { SpawnOptions } from "@expo/spawn-async"
import { existsSync } from "fs-extra"

import { iLog, vLog, wLog } from "@plasmo/utils"

import type { CommonPath } from "~features/extension-devtools/common-path"

const gitInitAddCommit = async (root: string) => {
  const { default: chalk } = await import("chalk")
  const commonOpt: SpawnOptions = { cwd: root, ignoreStdio: true }

  try {
    vLog("Checking if the root is a git repository")
    await spawnAsync("git", ["rev-parse", "--is-inside-work-tree"], commonOpt)
    vLog(`${root} is a git repository, bailing ${chalk.bold("git init")}`)
    return false
  } catch (e: any) {
    if (e.errno === "ENOENT") {
      throw new Error("Unable to initialize git repo. `git` not in PATH.")
    }
  }

  iLog("Initializing git project...")

  await spawnAsync("git", ["init"], commonOpt)

  await spawnAsync("git", ["add", "--all"], commonOpt)

  await spawnAsync(
    "git",
    ["commit", "-m", "Created a new Plasmo extension"],
    commonOpt
  )
  vLog("Added all files to git and created the initial commit.")

  return true
}

export async function gitInit(
  commonPath: CommonPath,
  root: string
): Promise<boolean> {
  if (!existsSync(commonPath.gitIgnorePath)) {
    return false
  }

  try {
    return await gitInitAddCommit(root)
  } catch (error: any) {
    wLog(error.message)
    return false
  }
}
