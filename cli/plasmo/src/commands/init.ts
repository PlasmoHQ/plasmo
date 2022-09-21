import { paramCase } from "change-case"
import { resolve } from "path"
import { cwd } from "process"

import { hasFlag, vLog } from "@plasmo/utils"

import { getCommonPath } from "~features/extension-devtools/common-path"
import { getPackageManager } from "~features/helpers/package-manager"
import { printHeader } from "~features/helpers/print"
import { ensureNonEmptyAndWritable } from "~features/init/ensure-neaw"
import { getRawName } from "~features/init/get-raw-name"
import { gitInit } from "~features/init/git-init"
import { installDependencies } from "~features/init/install-dependencies"
import { printReady } from "~features/init/print-ready"
import { ProjectCreator } from "~features/init/project-creator"

async function init() {
  printHeader()

  const isExample = hasFlag("--exp")
  const rawName = await getRawName()

  const currentDirectory = cwd()

  // For resolving project directory
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

  await ensureNonEmptyAndWritable(projectDirectory)

  const packageManager = await getPackageManager()
  vLog(
    `Using package manager: ${packageManager.name} ${packageManager?.version}`
  )

  const creator = new ProjectCreator(commonPath, packageManager, isExample)
  await creator.create()

  await installDependencies(projectDirectory, packageManager)

  await gitInit(commonPath, projectDirectory)

  await printReady(
    projectDirectory,
    currentDirectory,
    commonPath,
    packageManager
  )
}

export default init
