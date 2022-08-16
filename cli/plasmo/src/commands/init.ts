import spawnAsync from "@expo/spawn-async"
import { paramCase } from "change-case"
import { existsSync } from "fs"
import { mkdir } from "fs/promises"
import { createQuestId } from "mnemonic-id"
import { resolve } from "path"
import { cwd } from "process"

import {
  dryRun,
  getNonFlagArgvs,
  hasFlag,
  iLog,
  isFolderEmpty,
  isWriteable,
  sLog,
  vLog,
  wLog
} from "@plasmo/utils"

import { getCommonPath } from "~features/extension-devtools/common-path"
import { ProjectCreator } from "~features/extension-devtools/project-creator"
import { initGitRepoAsync } from "~features/helpers/git"
import { getPackageManager } from "~features/helpers/package-manager"
import { printHeader } from "~features/helpers/print"

async function init() {
  printHeader()

  vLog("Prompting for the extension name")

  const {
    default: { prompt }
  } = await import("inquirer")

  const [rawNameNonInteractive] = getNonFlagArgvs("init")
  const rawName =
    rawNameNonInteractive ||
    (
      await prompt({
        name: "rawName",
        prefix: "🟡",
        message: "Extension name:",
        default: createQuestId()
      })
    ).rawName

  const isExample = hasFlag("--exp")

  // For resolving project directory
  const currentDirectory = cwd()
  const projectDirectory = resolve(
    currentDirectory,
    paramCase(rawName) || rawName
  )
  vLog("Project directory:", projectDirectory)

  const commonPath = getCommonPath(projectDirectory)

  vLog("Package name:", commonPath.packageName)

  if (isExample && !commonPath.packageName.startsWith("with-")) {
    throw new Error("Example extensions must have the `with-` prefix")
  }

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

  const packageManager = await getPackageManager()
  vLog(
    `Using package manager: ${packageManager.name} ${packageManager?.version}`
  )

  const creator = new ProjectCreator(commonPath, packageManager, isExample)
  await creator.create()

  try {
    iLog("Installing dependencies...")
    await spawnAsync(packageManager.name, ["install"], {
      cwd: projectDirectory,
      stdio: "inherit"
    })
  } catch (error) {
    wLog(error.message)
  }

  if (existsSync(commonPath.gitIgnorePath)) {
    try {
      await initGitRepoAsync(projectDirectory)
    } catch (error) {
      wLog(error.message)
    }
  }

  const { default: chalk } = await import("chalk")

  sLog(
    "Your extension is ready in: ",
    chalk.yellowBright(projectDirectory),
    `\n\n    To start hacking, run:\n\n`,
    projectDirectory === currentDirectory
      ? ""
      : `      cd ${commonPath.packageName}\n`,
    `      ${packageManager.name} ${
      packageManager.name === "npm" ? "run dev" : "dev"
    }\n`,
    "\n    Visit https://docs.plasmo.com for documentation and more examples."
  )
}

export default init
