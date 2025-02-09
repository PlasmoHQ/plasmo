import { hasFlag } from "@plasmo/utils/flags"
import { iLog } from "@plasmo/utils/logging"

import { getBundleConfig } from "~features/extension-devtools/get-bundle-config"
import { checkNewVersion } from "~features/framework-update/version-tracker"
import { printHeader } from "~features/helpers/print"
import { createManifest } from "~features/manifest-factory/create-manifest"
import { zipBundle } from "~features/manifest-factory/zip"

async function packageCmd() {
  printHeader()
  checkNewVersion()

  process.env.NODE_ENV = "production"

  iLog("Prepare to package the extension bundle...")

  const bundleConfig = getBundleConfig()

  const plasmoManifest = await createManifest(bundleConfig)

  await zipBundle(plasmoManifest.commonPath, hasFlag("--with-source-maps"))
}

export default packageCmd
