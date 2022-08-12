import { paramCase } from "change-case"
import { createWriteStream } from "fs"
import { emptyDir } from "fs-extra"
import { resolve } from "path"
import { cwd } from "process"

import { getFlag, getNonFlagArgvs, hasFlag, iLog, sLog } from "@plasmo/utils"

import { getCommonPath } from "~features/extension-devtools/common-path"
import { nextNewTab } from "~features/extra/next-new-tab"
import { createParcelBuilder } from "~features/helpers/create-parcel-bundler"
import { printHeader } from "~features/helpers/print"
import { createManifest } from "~features/manifest-factory/create-manifest"

async function build() {
  printHeader()

  process.env.NODE_ENV = "production"

  const [internalCmd] = getNonFlagArgvs("build")

  const target = paramCase(getFlag("--target") || "chrome-mv3")

  const commonPath = getCommonPath(cwd(), target)

  if (internalCmd === "next-new-tab") {
    await nextNewTab(commonPath)
    return
  }

  iLog("Prepare to bundle the extension...")

  const [browser, manifestVersion] = target.split("-")

  const plasmoManifest = await createManifest(commonPath, {
    browser,
    manifestVersion
  })

  await emptyDir(commonPath.distDirectory)

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
      distDir: commonPath.distDirectory
    },
    env: plasmoManifest.envConfig.plasmoPublicEnv
  })

  const result = await bundler.run()
  sLog(`Finished in ${result.buildTime}ms!`)

  await plasmoManifest.postBuild()

  if (hasFlag("--zip")) {
    const { default: archiver } = await import("archiver")
    const zip = archiver("zip", {
      zlib: { level: 9 }
    })

    const zipFilePath = resolve(
      commonPath.buildDirectory,
      `${commonPath.distDirectoryName}.zip`
    )

    const output = createWriteStream(zipFilePath)
    output.on("close", () => {
      iLog(`Zip Package size: ${zip.pointer()} bytes`)
    })

    zip.pipe(output)

    zip.directory(commonPath.distDirectory, "")

    await zip.finalize()
  }
}

export default build
