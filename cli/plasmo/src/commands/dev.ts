import { paramCase } from "change-case"
import { cwd } from "process"

import { aLog, eLog, getFlag, hasFlag, iLog, vLog } from "@plasmo/utils"

import { getCommonPath } from "~features/extension-devtools/common-path"
import { createProjectWatcher } from "~features/extension-devtools/project-watcher"
import { createParcelBuilder } from "~features/helpers/create-parcel-bundler"
import { printHeader } from "~features/helpers/print"
import { createManifest } from "~features/manifest-factory/create-manifest"

async function dev() {
  printHeader()

  process.env.NODE_ENV = "development"

  const isImpulse = hasFlag("--impulse")

  const rawServePort = getFlag("--serve-port") || "1012"
  const rawHmrPort = getFlag("--hmr-port") || "1815"

  iLog("Starting the extension development server...")

  // firefox-mv2
  const target = paramCase(getFlag("--target") || "chrome-mv3")

  const commonPath = getCommonPath(cwd(), target)

  const [browser, manifestVersion] = target.split("-")

  const plasmoManifest = await createManifest(commonPath, {
    browser,
    manifestVersion
  })

  const projectWatcher = isImpulse
    ? null
    : await createProjectWatcher(plasmoManifest)

  const { default: getPort } = await import("get-port")

  const [servePort, hmrPort] = await Promise.all([
    getPort({ port: parseInt(rawServePort) }),
    getPort({ port: parseInt(rawHmrPort) })
  ])

  vLog(`Starting dev server on ${servePort}, HMR on ${hmrPort}...`)

  const bundler = await createParcelBuilder(commonPath, {
    logLevel: "verbose",
    defaultTargetOptions: {
      sourceMaps: hasFlag("--no-source-maps") ? false : true,
      engines: {
        browsers: ["last 1 Chrome version"]
      },
      distDir: commonPath.distDirectory
    },
    serveOptions: {
      host: "localhost",
      port: servePort
    },
    hmrOptions: {
      host: "localhost",
      port: hmrPort
    },
    env: plasmoManifest.envConfig.plasmoPublicEnv
  })

  const { default: chalk } = await import("chalk")

  const bundlerWatcher = await bundler.watch(async (err, event) => {
    if (err) {
      throw err
    }

    if (event.type === "buildSuccess") {
      iLog(`✨ Extension reloaded in ${event.buildTime}ms!`)
      await plasmoManifest.postBuild()
    } else if (event.type === "buildFailure") {
      event.diagnostics.forEach((diagnostic) => {
        eLog(chalk.redBright(diagnostic.message))
        if (diagnostic.stack) {
          aLog(diagnostic.stack)
        }

        diagnostic.hints?.forEach((hint) => {
          aLog(hint)
        })

        diagnostic.codeFrames?.forEach((codeFrame) => {
          if (codeFrame.code) {
            aLog(codeFrame.code)
          }
          codeFrame.codeHighlights.forEach((codeHighlight) => {
            if (codeHighlight.message) {
              aLog(codeHighlight.message)
            }

            aLog(
              chalk.underline(
                `${codeFrame.filePath}:${codeHighlight.start.line}:${codeHighlight.start.column}`
              )
            )
          })
        })
      })
    }
  })

  const cleanup = () => {
    projectWatcher?.unsubscribe()
    bundlerWatcher.unsubscribe()
  }

  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
}

export default dev
