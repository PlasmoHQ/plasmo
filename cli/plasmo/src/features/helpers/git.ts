import spawnAsync, { SpawnOptions } from "@expo/spawn-async"

import { iLog, vLog } from "@plasmo/utils"

export async function initGitRepoAsync(root: string): Promise<boolean> {
  const { default: chalk } = await import("chalk")
  const commonOpt: SpawnOptions = { cwd: root, ignoreStdio: true }

  try {
    vLog("Checking if the root is a git repository")
    await spawnAsync("git", ["rev-parse", "--is-inside-work-tree"], commonOpt)
    vLog(`${root} is a git repository, bailing ${chalk.bold("git init")}`)
    return
  } catch (e) {
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
}
