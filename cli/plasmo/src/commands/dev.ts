import {
  BuildSocketEvent,
  getBuildSocket
} from "@plasmo/framework-shared/build-socket"
import { getFlag, isVerbose } from "@plasmo/utils/flags"
import { eLog, iLog, sLog, vLog } from "@plasmo/utils/logging"

import { getBundleConfig } from "~features/extension-devtools/get-bundle-config"
import { createProjectWatcher } from "~features/extension-devtools/project-watcher"
import { checkNewVersion } from "~features/framework-update/version-tracker"
import { startLoading, stopLoading } from "~features/helpers/loading-animation"
import { printHeader } from "~features/helpers/print"
import { createViteBuilder } from "~features/helpers/create-vite-bundler"
import { createManifest } from "~features/manifest-factory/create-manifest"
import { createServer } from 'vite'

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

  const { default: chalk } = await import("chalk")

  const viteConfig = await createViteBuilder(plasmoManifest, {
    mode: "production",
    server: {
      host: serveHost,
      port: servePort,
      hmr: {
        host: hmrHost,
        port: hmrPort
      }
    },
    plugins: [
      {
        name: "build-logger",

        // 🔥 DEVELOPMENT MODE (vite dev)
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            console.log(`📢 Incoming request: ${req.url}`);
            next();
          });
        },

        async handleHotUpdate() {
          startLoading();

          const startTime = performance.now();

          return new Promise((resolve) => {
            setTimeout(async () => {
              stopLoading();

              const endTime = performance.now();
              const buildTime = (endTime - startTime).toFixed(2);

              sLog(`Extension re-packaged in ${chalk.bold(buildTime)}ms! 🚀`);

              await plasmoManifest.postBuild();
              buildWatcher.broadcast(BuildSocketEvent.BuildReady);

              resolve([]);
            }, 0);
          });
        },


        // 🏗 BUILD MODE (vite build)
        buildStart() {
        },

        // 🏗 BUILD MODE (vite build)
        async buildEnd(this, error) {

        },

        closeBundle() {
          console.log("🎉 Finalizing build...");
        },
      },
    ]
    // defaultTargetOptions: {
    //   shouldOptimize: true,
    //   shouldScopeHoist: hasFlag("--hoist")
    // }
  })

  const watchPath = plasmoManifest.commonPath.projectDirectory

  console.log("watchPath:", watchPath)

  const previewServer = await createServer({
    ...viteConfig,
    root: watchPath,
    server: {
      host: hmrHost,
      port: hmrPort
    },
  })

  await previewServer.listen()

  previewServer.printUrls()
  previewServer.bindCLIShortcuts({ print: true })

  // const bundlerWatcher = await bundler.watch(async (err, event) => {
  //   if (err) {
  //     stopLoading()
  //     throw err
  //   }


  //   if (event.type === "buildFailure") {
  //     stopLoading()
  //     if (!isVerbose()) {
  //       eLog(
  //         chalk.redBright(
  //           `Build failed. To debug, run ${chalk.bold("plasmo dev --verbose")}.`
  //         )
  //       )
  //     }
  //     event.diagnostics.forEach((diagnostic) => {
  //       eLog(chalk.redBright(diagnostic.message))
  //       if (diagnostic.stack) {
  //         vLog(diagnostic.stack)
  //       }

  //       diagnostic.hints?.forEach((hint) => {
  //         vLog(hint)
  //       })

  //       diagnostic.codeFrames?.forEach((codeFrame) => {
  //         if (codeFrame.code) {
  //           vLog(codeFrame.code)
  //         }
  //         codeFrame.codeHighlights.forEach((codeHighlight) => {
  //           if (codeHighlight.message) {
  //             vLog(codeHighlight.message)
  //           }

  //           vLog(
  //             chalk.underline(
  //               `${codeFrame.filePath}:${codeHighlight.start.line}:${codeHighlight.start.column}`
  //             )
  //           )
  //         })
  //       })
  //     })
  //   }
  //   process.env.__PLASMO_FRAMEWORK_INTERNAL_WATCHER_STARTED = "true"
  // })

  // const cleanup = () => {
  //   projectWatcher?.unsubscribe()
  //   bundlerWatcher.unsubscribe()
  // }

  // process.on("SIGINT", cleanup)
  // process.on("SIGTERM", cleanup)
}

export default dev
