import { sLog } from "@plasmo/utils"

import type { CommonPath } from "~features/extension-devtools/common-path"
import type { PackageManagerInfo } from "~features/helpers/package-manager"

export const printReady = async (
  projectDirectory: string,
  currentDirectory: string,
  commonPath: CommonPath,
  packageManager: PackageManagerInfo
) => {
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
