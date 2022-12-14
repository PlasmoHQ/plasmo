import { createWriteStream } from "fs"
import { resolve } from "path"

import { getNonFlagArgvs, hasFlag, iLog, sLog } from "@plasmo/utils"

import { getBundleConfig } from "~features/extension-devtools/get-bundle-config"
import { nextNewTab } from "~features/extra/next-new-tab"
import { createParcelBuilder } from "~features/helpers/create-parcel-bundler"
import { printHeader } from "~features/helpers/print"
import { createManifest } from "~features/manifest-factory/create-manifest"

async function build() {
  printHeader()

  process.env.NODE_ENV = "production"

  const [internalCmd] = getNonFlagArgvs("build")

  if (internalCmd === "next-new-tab") {
    await nextNewTab()
    return
  }

  iLog("Prepare to bundle the extension...")

  const bundleConfig = getBundleConfig()

  const plasmoManifest = await createManifest(bundleConfig)

  const { distDirectory, buildDirectory, distDirectoryName } =
    plasmoManifest.commonPath

  const bundler = await createParcelBuilder(plasmoManifest.commonPath, {
    mode: "production",
    shouldDisableCache: true,
    shouldContentHash: false,
    defaultTargetOptions: {
      shouldOptimize: true,
      shouldScopeHoist: true,
      sourceMaps: hasFlag("--source-maps"),
      engines: bundleConfig.engines,
      distDir: distDirectory
    },
    env: plasmoManifest.publicEnv.extends(bundleConfig).data
  })

  const result = await bundler.run()
  sLog(`Finished in ${result.buildTime}ms!`)

  await plasmoManifest.postBuild()

  if (hasFlag("--zip")) {
    const { default: archiver } = await import("archiver")
    const zip = archiver("zip", {
      zlib: { level: 9 }
    })

    const zipFilePath = resolve(buildDirectory, `${distDirectoryName}.zip`)

    const output = createWriteStream(zipFilePath)
    output.on("close", () => {
      iLog(`Zip Package size: ${zip.pointer()} bytes`)
    })

    zip.pipe(output)

    zip.directory(distDirectory, "")

    await zip.finalize()
  }
}

export default build
