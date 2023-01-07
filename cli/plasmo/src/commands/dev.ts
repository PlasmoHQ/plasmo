import { getFlag, hasFlag } from "@plasmo/utils/flags"
import { aLog, eLog, iLog, vLog } from "@plasmo/utils/logging"

import { createBuildSocket } from "~features/extension-devtools/build-socket"
import { getBundleConfig } from "~features/extension-devtools/get-bundle-config"
import { createProjectWatcher } from "~features/extension-devtools/project-watcher"
import { createParcelBuilder } from "~features/helpers/create-parcel-bundler"
import { printHeader } from "~features/helpers/print"
import { createManifest } from "~features/manifest-factory/create-manifest"

async function dev() {
  printHeader()

  process.env.NODE_ENV = "development"

  const rawServePort = getFlag("--serve-port") || "1012"
  const rawHmrPort = getFlag("--hmr-port") || "1815"

  iLog("Starting the extension development server...")

  const bundleConfig = getBundleConfig()

  const plasmoManifest = await createManifest(bundleConfig)

  const projectWatcher = await createProjectWatcher(plasmoManifest)

  const { default: getPort } = await import("get-port")

  const [servePort, hmrPort] = await Promise.all([
    getPort({ port: parseInt(rawServePort) }),
    getPort({ port: parseInt(rawHmrPort) })
  ])

  vLog(`Starting dev server on ${servePort}, HMR on ${hmrPort}...`)

  const bundler = await createParcelBuilder(plasmoManifest, {
    logLevel: "verbose",
    shouldBundleIncrementally: true,
    defaultTargetOptions: {
      sourceMaps: !hasFlag("--no-source-maps")
    },
    serveOptions: {
      host: "localhost",
      port: servePort
    },
    hmrOptions: {
      host: "localhost",
      port: hmrPort
    }
  })

  const { default: chalk } = await import("chalk")

  const buildWatcher = await createBuildSocket(hmrPort)
  const bundlerWatcher = await bundler.watch(async (err, event) => {
    if (err) {
      throw err
    }

    if (event === undefined) {
      return
    }

    if (event.type === "buildSuccess") {
      aLog(`Extension re-packaged in ${chalk.bold(event.buildTime)}ms! 🚀`)

      await plasmoManifest.postBuild()

      buildWatcher.triggerReload()
    } else if (event.type === "buildFailure") {
      event.diagnostics.forEach((diagnostic) => {
        eLog(chalk.redBright(diagnostic.message))
        if (diagnostic.stack) {
          vLog(diagnostic.stack)
        }

        diagnostic.hints?.forEach((hint) => {
          vLog(hint)
        })

        diagnostic.codeFrames?.forEach((codeFrame) => {
          if (codeFrame.code) {
            vLog(codeFrame.code)
          }
          codeFrame.codeHighlights.forEach((codeHighlight) => {
            if (codeHighlight.message) {
              vLog(codeHighlight.message)
            }

            vLog(
              chalk.underline(
                `${codeFrame.filePath}:${codeHighlight.start.line}:${codeHighlight.start.column}`
              )
            )
          })
        })
      })
    }
    process.env.__PLASMO_FRAMEWORK_INTERNAL_WATCHER_STARTED = "true"
  })

  const cleanup = () => {
    projectWatcher?.unsubscribe()
    bundlerWatcher.unsubscribe()
  }

  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
}

export default dev
