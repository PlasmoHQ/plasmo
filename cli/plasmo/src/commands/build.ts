import Parcel from "@parcel/core"
import { createWriteStream } from "fs"
import { emptyDir, ensureDir, readJson, writeJson } from "fs-extra"
import { cp, mkdir } from "fs/promises"
import { prompt } from "inquirer"
import { resolve } from "path"

import {
  fileExists,
  getNonFlagArgvs,
  hasFlag,
  iLog,
  sLog,
  vLog
} from "@plasmo/utils"

import { getCommonPath } from "~features/extension-devtools/common-path"
import { ensureManifest } from "~features/extension-devtools/ensure-manifest"
import { generateIcons } from "~features/extension-devtools/generate-icons"
import { generateNewTabManifest } from "~features/extension-devtools/manifest-helpers"
import type { PackageJSON } from "~features/extension-devtools/package-file"
import { loadEnvConfig } from "~features/extension-devtools/parse-env"
import { getProjectPath } from "~features/extension-devtools/project-path"
import { stripUnderscore } from "~features/extension-devtools/strip-underscore"

async function build() {
  const { default: chalk } = await import("chalk")

  const [internalCmd] = getNonFlagArgvs("build")

  const commonPath = getCommonPath()

  const {
    currentDirectory,
    buildDirectory,
    entryManifestPath,
    cacheDirectory,
    packageFilePath
  } = commonPath

  if (internalCmd === "next-new-tab") {
    vLog("Creating a Plasmo + Nextjs based new tab extension")
    const out = resolve(currentDirectory, "out")

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
    return
  }

  iLog("Prepare to bundle the extension...")

  const projectPath = getProjectPath(commonPath)

  // read typescript config file
  vLog("Make sure .plasmo exists")
  await ensureDir(commonPath.dotPlasmoDirectory)

  const [prodEnvConfig] = await Promise.all([
    loadEnvConfig(commonPath.currentDirectory),
    generateIcons(commonPath),
    ensureManifest(commonPath, projectPath)
  ])

  // TODO: Make this more dynamic
  const buildType = "chrome-mv3-prod"
  const distDir = resolve(buildDirectory, buildType)
  const cacheDir = resolve(cacheDirectory, "parcel")

  await emptyDir(distDir)

  const bundler = new Parcel({
    cacheDir,
    entries: entryManifestPath,
    config: require.resolve("@parcel/config-webextension"),
    shouldAutoInstall: true,
    shouldDisableCache: true,
    mode: "production",
    defaultTargetOptions: {
      shouldOptimize: true,
      shouldScopeHoist: true,
      sourceMaps: false,
      engines: {
        browsers: ["last 1 Chrome version"]
      },
      distDir
    },
    env: prodEnvConfig.plasmoPublicEnv
  })

  const result = await bundler.run()
  sLog(`Finished in ${result.buildTime}ms!`)

  if (hasFlag("--zip")) {
    const { default: archiver } = await import("archiver")
    const zip = archiver("zip", {
      zlib: { level: 9 }
    })

    const zipFilePath = resolve(buildDirectory, `${buildType}.zip`)

    const output = createWriteStream(zipFilePath)
    output.on("close", () => {
      iLog(`Zip Package size: ${zip.pointer()} bytes`)
    })

    zip.pipe(output)

    zip.directory(distDir, "")

    await zip.finalize()
  }
}

export default build
