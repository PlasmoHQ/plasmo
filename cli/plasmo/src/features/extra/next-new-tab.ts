import { sentenceCase } from "change-case"
import { copy, emptyDir, readJson, writeJson } from "fs-extra"
import { mkdir } from "fs/promises"
import { resolve } from "path"

import { fileExists } from "@plasmo/utils/fs"
import { sLog, vLog } from "@plasmo/utils/logging"

import { getCommonPath } from "~features/extension-devtools/common-path"
import type { PackageJSON } from "~features/extension-devtools/package-file"
import { stripUnderscore } from "~features/extension-devtools/strip-underscore"

export const generateNewTabManifest = (packageData: PackageJSON) => ({
  name: sentenceCase(packageData.name),
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  chrome_url_overrides: {
    newtab: "./index.html"
  }
})

export const nextNewTab = async () => {
  const { projectDirectory, packageFilePath } = getCommonPath()

  vLog("Creating a Plasmo + Nextjs based new tab extension")
  const out = resolve(projectDirectory, "out")

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

  const extensionDirectory = resolve(projectDirectory, "extension")
  if (await fileExists(extensionDirectory)) {
    const {
      default: { prompt }
    } = await import("inquirer")

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
  await copy(out, extensionDirectory, { recursive: true })
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
