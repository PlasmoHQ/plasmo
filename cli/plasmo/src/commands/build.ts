import { paramCase } from "change-case"
import { createWriteStream } from "fs"
import { emptyDir, ensureDir } from "fs-extra"
import { resolve } from "path"

import {
  getFlag,
  getNonFlagArgvs,
  hasFlag,
  iLog,
  sLog,
  vLog
} from "@plasmo/utils"

import { getCommonPath } from "~features/extension-devtools/common-path"
import { ensureManifest } from "~features/extension-devtools/ensure-manifest"
import { generateIcons } from "~features/extension-devtools/generate-icons"
import { generateLocales } from "~features/extension-devtools/generate-locales"
import { getProjectPath } from "~features/extension-devtools/project-path"
import { nextNewTab } from "~features/extra/next-new-tab"
import { createParcelBuilder } from "~features/helpers/create-parcel-bundler"
import { printHeader } from "~features/helpers/print"

async function build() {
  printHeader()

  process.env.NODE_ENV = "production"

  const [internalCmd] = getNonFlagArgvs("build")

  const commonPath = getCommonPath()

  if (internalCmd === "next-new-tab") {
    await nextNewTab(commonPath)
    return
  }

  const { buildDirectory } = commonPath

  iLog("Prepare to bundle the extension...")

  const projectPath = getProjectPath(commonPath)

  const target = paramCase(getFlag("--target") || "chrome-mv3")

  const [browser, manifestVersion] = target.split("-")

  const distDirName = `${target}-prod`

  const distDir = resolve(commonPath.buildDirectory, distDirName)

  // read typescript config file
  vLog("Make sure .plasmo exists")
  await ensureDir(commonPath.dotPlasmoDirectory)

  await generateIcons(commonPath)
  await generateLocales(commonPath)

  const plasmoManifest = await ensureManifest(commonPath, projectPath, {
    browser,
    manifestVersion
  })

  await emptyDir(distDir)

  const bundler = await createParcelBuilder(commonPath, {
    mode: "production",
    shouldDisableCache: true,
    shouldContentHash: false,
    defaultTargetOptions: {
      shouldOptimize: true,
      shouldScopeHoist: true,
      sourceMaps: false,
      engines: {
        browsers: ["last 1 Chrome version"]
      },
      distDir
    },
    env: plasmoManifest.envConfig.plasmoPublicEnv
  })

  const result = await bundler.run()
  sLog(`Finished in ${result.buildTime}ms!`)

  if (hasFlag("--zip")) {
    const { default: archiver } = await import("archiver")
    const zip = archiver("zip", {
      zlib: { level: 9 }
    })

    const zipFilePath = resolve(buildDirectory, `${distDirName}.zip`)

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
