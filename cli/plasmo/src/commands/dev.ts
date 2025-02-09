import {
  BuildSocketEvent,
  getBuildSocket
} from "@plasmo/framework-shared/build-socket"
import { getFlag, isVerbose } from "@plasmo/utils/flags"
import { eLog, iLog, sLog, vLog } from "@plasmo/utils/logging"

import { getBundleConfig } from "~features/extension-devtools/get-bundle-config"
import { createProjectWatcher } from "~features/extension-devtools/project-watcher"
import { checkNewVersion } from "~features/framework-update/version-tracker"
import { createParcelBuilder } from "~features/helpers/create-parcel-bundler"
import { startLoading, stopLoading } from "~features/helpers/loading-animation"
import { printHeader } from "~features/helpers/print"
import { createManifest } from "~features/manifest-factory/create-manifest"

async function dev() {
  printHeader()
  checkNewVersion()

  process.env.NODE_ENV = "development"

  const rawServePort = getFlag("--serve-port") || "1012"
  const serveHost = getFlag("--serve-host") || "localhost"
  const rawHmrPort = getFlag("--hmr-port") || "1815"
  const hmrHost = getFlag("--hmr-host") || "localhost"

  iLog("Starting the extension development server...")

  const { default: getPort } = await import("get-port")

  const [servePort, hmrPort] = await Promise.all([
    getPort({ port: parseInt(rawServePort) }),
    getPort({ port: parseInt(rawHmrPort) })
  ])

  const buildWatcher = getBuildSocket(hmrHost, hmrPort)
  vLog(
    `Starting dev server on ${serveHost}:${servePort}, HMR on ${hmrHost}:${hmrPort}...`
  )

  const bundleConfig = getBundleConfig()

  iLog("Building for target:", bundleConfig.target)

  const plasmoManifest = await createManifest(bundleConfig)

  const projectWatcher = await createProjectWatcher(plasmoManifest)

  const bundler = await createParcelBuilder(plasmoManifest, {
    logLevel: "verbose",
    shouldBundleIncrementally: true,
    serveOptions: {
      host: serveHost,
      port: servePort
    },
    hmrOptions: {
      host: hmrHost,
      port: hmrPort
    }
  })

  const { default: chalk } = await import("chalk")

  const bundlerWatcher = await bundler.watch(async (err, event) => {
    if (err) {
      stopLoading()
      throw err
    }

    if (event === undefined) {
      return
    }

    if (event.type === "buildStart") {
      startLoading()
      return
    }

    if (event.type === "buildSuccess") {
      stopLoading()
      sLog(`Extension re-packaged in ${chalk.bold(event.buildTime)}ms! 🚀`)
      await plasmoManifest.postBuild()
      buildWatcher.broadcast(BuildSocketEvent.BuildReady)
      return
    }

    if (event.type === "buildFailure") {
      stopLoading()
      if (!isVerbose()) {
        eLog(
          chalk.redBright(
            `Build failed. To debug, run ${chalk.bold("plasmo dev --verbose")}.`
          )
        )
      }
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
