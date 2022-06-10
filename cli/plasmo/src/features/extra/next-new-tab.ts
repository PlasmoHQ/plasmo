import { emptyDir, readJson, writeJson } from "fs-extra"
import { cp, mkdir } from "fs/promises"
import { prompt } from "inquirer"
import { resolve } from "path"

import { fileExists, sLog, vLog } from "@plasmo/utils"

import type { CommonPath } from "~features/extension-devtools/common-path"
import { generateNewTabManifest } from "~features/extension-devtools/manifest-helpers"
import type { PackageJSON } from "~features/extension-devtools/package-file"
import { stripUnderscore } from "~features/extension-devtools/strip-underscore"

export const nextNewTab = async (commonPath: CommonPath) => {
  const { currentDirectory, packageFilePath } = commonPath

  vLog("Creating a Plasmo + Nextjs based new tab extension")
  const out = resolve(currentDirectory, "out")

  const { default: chalk } = await import("chalk")

  if (!(await fileExists(out))) {
    throw new Error(
      `${chalk.bold(
        "out"
      )} directory does not exist, did you forget to run "${chalk.underline(
        "next build && next export"
      )}"?`
    )
  }

  const packageData: PackageJSON = await readJson(packageFilePath)

  const extensionDirectory = resolve(currentDirectory, "extension")
  if (await fileExists(extensionDirectory)) {
    const { answer } = await prompt({
      type: "confirm",
      name: "answer",
      message: `${chalk.bold(
        "extension"
      )} directory already exists, do you want to overwrite it?`
    })

    if (!answer) {
      throw new Error("Aborted")
    }

    await emptyDir(extensionDirectory)
  }

  await mkdir(extensionDirectory)
  await cp(out, extensionDirectory, { recursive: true })
  vLog("Extension created at:", extensionDirectory)

  await stripUnderscore(extensionDirectory)

  // Create manifest.json with chrome_url_overrides with index.html

  await writeJson(
    resolve(extensionDirectory, "manifest.json"),
    generateNewTabManifest(packageData),
    {
      spaces: 2
    }
  )

  sLog("Your extension is ready in the extension/ directory")
}
