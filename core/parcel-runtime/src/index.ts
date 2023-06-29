import { Runtime } from "@parcel/plugin"
import fs from "fs"
import path, { basename, dirname, join } from "path"

import { vLog } from "@plasmo/utils/logging"

import {
  type PlasmoRuntime,
  type RuntimeData,
  plasmoRuntimeList
} from "./types"

const devRuntimeMap = plasmoRuntimeList.reduce(
  (accumulatedRuntimeMap, currentRuntime) => ({
    ...accumulatedRuntimeMap,
    [currentRuntime]: fs.readFileSync(
      path.join(__dirname, `./runtimes/${currentRuntime}.js`),
      "utf8"
    )
  }),
  {} as Record<PlasmoRuntime, string>
)

export default new Runtime({
  async loadConfig({ config }) {
    const pkg = await config
      .getConfigFrom<{
        dependencies: Record<string, string>
        devDependencies: Record<string, string>
      }>(
        join(process.env.PLASMO_PROJECT_DIR, "lab"), // parcel only look up
        ["package.json"],
        {
          exclude: true
        }
      )
      .then((cfg) => cfg?.contents)

    const hasReact = !!pkg?.dependencies?.react || !!pkg?.devDependencies?.react

    return {
      hasReact
    }
  },

  apply({ bundle, options, config, bundleGraph }) {
    if (bundle.name === "manifest.json") {
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

    const entryFilePath = bundle.getMainEntry()?.filePath

    if (!entryFilePath) {
      return
    }

    const isPlasmo = entryFilePath.includes(".plasmo")

    const isBackground =
      entryFilePath.startsWith(
        join(process.env.PLASMO_SRC_DIR, "background")
      ) ||
      entryFilePath.endsWith(join("static", "background", "index.ts")) ||
      entryFilePath.endsWith("plasmo-default-background.ts")

    const isPlasmoSrc =
      isPlasmo ||
      isBackground ||
      entryFilePath.startsWith(join(process.env.PLASMO_SRC_DIR, "content"))

    if (!isPlasmoSrc) {
      return
    }

    const isReact = config.hasReact && entryFilePath.endsWith(".tsx")

    const entryBasename = basename(entryFilePath).split(".")[0]

    const isContentScript =
      dirname(entryFilePath).endsWith("contents") || entryBasename === "content"

    if (
      process.env.__PLASMO_FRAMEWORK_INTERNAL_NO_CS_RELOAD === "true" &&
      isContentScript
    ) {
      return
    }

    // TODO: add production runtimes
    const devRuntime: PlasmoRuntime = isBackground
      ? "background-service-runtime"
      : isContentScript
      ? "script-runtime"
      : "page-runtime"

    vLog(
      "@plasmohq/parcel-runtime",
      "Injecting <<",
      devRuntime,
      ">> for",
      bundle.displayName,
      bundle.id,
      entryFilePath
    )

    const runtimeData: RuntimeData = {
      isContentScript,
      isBackground,
      isReact,

      runtimes: [devRuntime],

      ...options.hmrOptions,
      entryFilePath: String.raw`${entryFilePath}`,
      bundleId: bundle.id,
      envHash: bundle.env.id,

      verbose: process.env.VERBOSE,

      secure: !!(options.serveOptions && options.serveOptions.https),
      serverPort: options.serveOptions && options.serveOptions.port
    }

    const code = devRuntimeMap[devRuntime].replace(
      `__plasmo_runtime_data__`, // double quote to escape
      JSON.stringify(runtimeData)
    )

    return {
      filePath: __filename,
      code,
      isEntry: true,
      env: {
        sourceType: "module"
      }
    }
  }
})
