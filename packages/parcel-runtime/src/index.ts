import { Runtime } from "@parcel/plugin"
import fs from "fs"
import path, { basename, dirname, join } from "path"

import { vLog } from "@plasmo/utils/logging"

import type { RuntimeData } from "./types"

const [pageRuntime, scriptRuntime, backgroundServiceRuntime] = [
  "page-runtime",
  "script-runtime",
  "background-service-runtime"
].map((runtimeName) =>
  fs.readFileSync(path.join(__dirname, `./${runtimeName}.js`), "utf8")
)

export default new Runtime({
  async loadConfig({ config, options }) {
    const pkg = await config.getPackage()
    const hasReact = !!pkg.dependencies.react || !!pkg.devDependencies.react

    return {
      hasReact
    }
  },

  apply({ bundle, options, config, bundleGraph }) {
    if (bundle.name == "manifest.json") {
      const asset = bundle.getMainEntry()
      if (asset?.meta.webextEntry !== true) {
        return
      }

      // Hack to bust packager cache when any descendants update
      const descendants = []
      bundleGraph.traverseBundles((b) => {
        descendants.push(b.id)
      }, bundle)

      return {
        filePath: __filename,
        code: JSON.stringify(descendants),
        isEntry: true
      }
    }

    if (
      bundle.type !== "js" ||
      !options.hmrOptions ||
      bundle.env.isLibrary ||
      bundle.env.isWorklet() ||
      options.mode !== "development" ||
      bundle.env.sourceType === "script"
    ) {
      return
    }

    const entryFilePath = bundle.getMainEntry().filePath

    const isPlasmo = entryFilePath.includes(".plasmo")
    const isBackground = entryFilePath.endsWith("background.ts")

    const isPlasmoSrc =
      isPlasmo ||
      isBackground ||
      entryFilePath.startsWith(join(process.env.PLASMO_SRC_DIR, "contents")) ||
      entryFilePath.startsWith(join(process.env.PLASMO_SRC_DIR, "content"))

    if (!isPlasmoSrc) {
      return
    }

    vLog("@plasmohq/parcel-runtime")

    const isReact = config.hasReact && entryFilePath.endsWith(".tsx")

    const entryBasename = basename(entryFilePath).split(".")[0]

    const isContentScript =
      dirname(entryFilePath).endsWith("contents") || entryBasename === "content"

    vLog("Injecting runtime for ", bundle.displayName, entryFilePath)

    const runtimeData: RuntimeData = {
      isContentScript,
      isBackground,
      isReact,

      ...options.hmrOptions,
      bundleId: bundle.id,
      envHash: bundle.env.id,

      secure: !!(options.serveOptions && options.serveOptions.https),
      serverPort: options.serveOptions && options.serveOptions.port
    }

    const runtimeCode = isBackground
      ? backgroundServiceRuntime
      : isContentScript
      ? scriptRuntime
      : pageRuntime

    return {
      filePath: __filename,
      code: runtimeCode.replace(
        `"__plasmo_runtime_data__"`, // double quote to escape
        JSON.stringify(runtimeData)
      ),
      isEntry: true,
      env: {
        sourceType: "module"
      }
    }
  }
})
