import { resolve } from "path"

import { state } from "./state"

export async function handleTabs() {
  const { filePath, asset, staticDir } = state

  const tabsDir = resolve(staticDir, "tabs")

  const tabsDirExists = await asset.fs.exists(tabsDir)

  // asset.addURLDependency("../runtime/default-bg.js", {
  //   resolveFrom: __filename,
  //   env: {
  //     context: "service-worker"
  //   }
  // })
}
