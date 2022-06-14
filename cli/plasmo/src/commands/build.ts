import Parcel from "@parcel/core"
import { createWriteStream } from "fs"
import { emptyDir, ensureDir } from "fs-extra"
import { resolve } from "path"

import { getNonFlagArgvs, hasFlag, iLog, sLog, vLog } from "@plasmo/utils"

import { getCommonPath } from "~features/extension-devtools/common-path"
import { ensureManifest } from "~features/extension-devtools/ensure-manifest"
import { generateIcons } from "~features/extension-devtools/generate-icons"
import { getProjectPath } from "~features/extension-devtools/project-path"
import { getTemplatePath } from "~features/extension-devtools/template-path"
import { nextNewTab } from "~features/extra/next-new-tab"

async function build() {
  process.env.NODE_ENV = "production"

  const [internalCmd] = getNonFlagArgvs("build")

  const commonPath = getCommonPath()
  const templatePath = getTemplatePath()

  if (internalCmd === "next-new-tab") {
    await nextNewTab(commonPath)
    return
  }

  const { buildDirectory, cacheDirectory } = commonPath

  iLog("Prepare to bundle the extension...")

  const projectPath = getProjectPath(commonPath)

  // read typescript config file
  vLog("Make sure .plasmo exists")
  await ensureDir(commonPath.dotPlasmoDirectory)
  await generateIcons(commonPath)

  const plasmoManifest = await ensureManifest(commonPath, projectPath)

  // TODO: Make this more dynamic
  const buildType = "chrome-mv3-prod"
  const distDir = resolve(buildDirectory, buildType)

  await emptyDir(distDir)

  const bundler = new Parcel({
    cacheDir: resolve(cacheDirectory, "parcel"),
    entries: commonPath.entryManifestPath,
    config: templatePath.parcelConfig,
    mode: "production",
    shouldAutoInstall: true,
    shouldDisableCache: true,
    defaultTargetOptions: {
      shouldOptimize: true,
      shouldScopeHoist: false,
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
