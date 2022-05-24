import spawnAsync from "@expo/spawn-async"
import { paramCase } from "change-case"
import { existsSync } from "fs"
import { copy, writeJson } from "fs-extra"
import { mkdir, writeFile } from "fs/promises"
import { prompt } from "inquirer"
import { createQuestId } from "mnemonic-id"
import { resolve } from "path"
import { cwd } from "process"

import {
  dryRun,
  eLog,
  getNonFlagArgvs,
  hasFlag,
  iLog,
  sLog,
  vLog
} from "@plasmo/utils"

import { generateGitIgnore } from "~features/extension-devtools/git-ignore"
import { generatePackage } from "~features/extension-devtools/package-file"
import { isFolderEmpty, isWriteable } from "~features/helpers/fs"
import { initGitRepoAsync } from "~features/helpers/git"
import { getPackageManager } from "~features/helpers/package-manager"
import { printHeader } from "~features/helpers/print"

async function init() {
  printHeader()

  vLog("Prompting for the extension name")

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

  const projectDirectory = resolve(cwd(), packageName)
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

  const packageData = generatePackage({
    name: packageName,
    packageManager
  })

  await writeJson(packageFilePath, packageData, {
    spaces: 2
  })

  const templatePath = resolve(__dirname, "..", "templates")

  iLog(`Copying template files...`)

  const initTemplatePath = resolve(templatePath, "init")
  const gitIgnorePath = resolve(projectDirectory, ".gitignore")

  const bppYaml = resolve(templatePath, "bpp.yml")
  const bppSubmitWorkflowYamlPath = resolve(
    projectDirectory,
    ".github",
    "workflows",
    "submit.yml"
  )

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
    `\n    To start hacking, run:\n\n`,
    `      cd ${packageName}\n`,
    `      ${packageManager.name} ${
      packageManager.name === "npm" ? "run dev" : "dev"
    }\n`
  )
}

export default init
