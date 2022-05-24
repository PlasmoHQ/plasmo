import { sentenceCase } from "change-case"

import type { PackageJSON } from "./package-file"

export const generateNewTabManifest = (packageData = null as PackageJSON) => ({
  name: sentenceCase(packageData.name),
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  chrome_url_overrides: {
    newtab: "./index.html"
  }
})
