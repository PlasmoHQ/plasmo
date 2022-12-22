import { getNonFlagArgvs } from "@plasmo/utils/argv"
import { hasFlag } from "@plasmo/utils/flags"
import { iLog, sLog } from "@plasmo/utils/logging"

import { getBundleConfig } from "~features/extension-devtools/get-bundle-config"
import { nextNewTab } from "~features/extra/next-new-tab"
import { createParcelBuilder } from "~features/helpers/create-parcel-bundler"
import { printHeader } from "~features/helpers/print"
import { createManifest } from "~features/manifest-factory/create-manifest"
import { zipBundle } from "~features/manifest-factory/zip"

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

  const bundler = await createParcelBuilder(plasmoManifest, {
    mode: "production",
    shouldDisableCache: true,
    shouldContentHash: false,
    defaultTargetOptions: {
      shouldOptimize: true,
      shouldScopeHoist: true,
      sourceMaps: hasFlag("--source-maps")
    }
  })

  const result = await bundler.run()
  sLog(`Finished in ${result.buildTime}ms!`)

  await plasmoManifest.postBuild()

  if (hasFlag("--zip")) {
    await zipBundle(plasmoManifest.commonPath)
  }
}

export default build
