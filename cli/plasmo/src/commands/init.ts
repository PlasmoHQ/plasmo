import { paramCase } from "change-case"
import { resolve } from "path"
import { cwd } from "process"

import { hasFlag } from "@plasmo/utils/flags"
import { ensureWritableAndEmpty } from "@plasmo/utils/fs"
import { vLog } from "@plasmo/utils/logging"

import { getCommonPath } from "~features/extension-devtools/common-path"
import { getPackageManager } from "~features/helpers/package-manager"
import { printHeader } from "~features/helpers/print"
import { ProjectCreator } from "~features/project-creator"
import { getRawName } from "~features/project-creator/get-raw-name"
import { gitInit } from "~features/project-creator/git-init"
import { installDependencies } from "~features/project-creator/install-dependencies"
import { printReady } from "~features/project-creator/print-ready"

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

  await ensureWritableAndEmpty(projectDirectory)

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
