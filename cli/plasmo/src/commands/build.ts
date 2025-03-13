import { getNonFlagArgvs } from "@plasmo/utils/argv"
import { hasFlag } from "@plasmo/utils/flags"
import { iLog, sLog } from "@plasmo/utils/logging"

import { getBundleConfig } from "~features/extension-devtools/get-bundle-config"
import { nextNewTab } from "~features/extra/next-new-tab"
import { checkNewVersion } from "~features/framework-update/version-tracker"
import { createViteBuilder } from "~features/helpers/create-vite-bundler"
import { printHeader } from "~features/helpers/print"
import { createManifest } from "~features/manifest-factory/create-manifest"
import { zipBundle } from "~features/manifest-factory/zip"
import { build } from 'vite'

async function buildPlasmo() {
  printHeader()
  checkNewVersion()

  process.env.NODE_ENV = "production"

  const [internalCmd] = getNonFlagArgvs("build")

  if (internalCmd === "next-new-tab") {
    await nextNewTab()
    return
  }

  iLog("Prepare to bundle the extension...")

  const bundleConfig = getBundleConfig()

  iLog("Building for target:", bundleConfig.target)

  const plasmoManifest = await createManifest(bundleConfig)

  // Use the Vite builder function
  const viteConfig = await createViteBuilder(plasmoManifest, {
    mode: "production",
    // defaultTargetOptions: {
    //   shouldOptimize: true,
    //   shouldScopeHoist: hasFlag("--hoist")
    // }
  })

  // Measure build time
  const startTime = Date.now()

  // Call vite.build() directly with the generated Vite config
  const result = await build(viteConfig)

  const endTime = Date.now()

  // Log the build time manually
  const buildDuration = endTime - startTime
  sLog(`Finished in ${buildDuration}ms!`)

  // await plasmoManifest.postBuild()

  if (hasFlag("--zip")) {
    await zipBundle(plasmoManifest.commonPath)
  }
}

export default buildPlasmo
