import spawnAsync from "@expo/spawn-async"
import { paramCase } from "change-case"
import { existsSync } from "fs"
import { copy, writeJson } from "fs-extra"
import { mkdir, writeFile } from "fs/promises"
import { createQuestId } from "mnemonic-id"
import { resolve } from "path"
import { cwd } from "process"

import {
  dryRun,
  eLog,
  getNonFlagArgvs,
  hasFlag,
  iLog,
  isFolderEmpty,
  isWriteable,
  sLog,
  vLog
} from "@plasmo/utils"

import { generateGitIgnore } from "~features/extension-devtools/git-ignore"
import { generatePackage } from "~features/extension-devtools/package-file"
import { getTemplatePath } from "~features/extension-devtools/template-path"
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

  const packageName = paramCase(rawName)
  const currentDirectory = cwd()
  const projectDirectory = resolve(currentDirectory, packageName)
  vLog("Absolute path:", projectDirectory)

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

  const packageFilePath = resolve(projectDirectory, "package.json")
  const packageNameFromDirectory = currentDirectory.split('/').pop()
  vLog("Package name:", packageName || packageNameFromDirectory)

  const packageData = generatePackage({
    name: packageName || packageNameFromDirectory,
    packageManager
  })

  await writeJson(packageFilePath, packageData, {
    spaces: 2
  })

  iLog(`Copying template files...`)

  const { initTemplatePath, bppYaml } = getTemplatePath()

  const bppSubmitWorkflowYamlPath = resolve(
    projectDirectory,
    ".github",
    "workflows",
    "submit.yml"
  )

  const gitIgnorePath = resolve(projectDirectory, ".gitignore")

  await Promise.all([
    copy(initTemplatePath, projectDirectory),
    !hasFlag("--no-bpp") && copy(bppYaml, bppSubmitWorkflowYamlPath),
    writeFile(gitIgnorePath, generateGitIgnore())
  ])

  iLog("Installing dependencies...")

  await spawnAsync(packageManager.name, ["install"], {
    cwd: projectDirectory,
    stdio: "inherit"
  })

  iLog("Initializing git project...")
  if (existsSync(gitIgnorePath)) {
    try {
      await initGitRepoAsync(projectDirectory)
    } catch (error) {
      eLog(error.message)
    }
  }

  const { default: chalk } = await import("chalk")

  sLog(
    "Your extension is ready in: ",
    chalk.yellowBright(projectDirectory),
    `\n\n    To start hacking, run:\n\n`,
    `      cd ${packageName}\n`,
    `      ${packageManager.name} ${
      packageManager.name === "npm" ? "run dev" : "dev"
    }\n`,
    "\n    Visit https://docs.plasmo.com for documentation and more examples."
  )
}

export default init
