import Parcel from "@parcel/core"
import { emptyDir, ensureDir } from "fs-extra"
import { resolve } from "path"

import { aLog, eLog, getNonFlagArgvs, hasFlag, iLog, vLog } from "@plasmo/utils"

import { getCommonPath } from "~features/extension-devtools/common-path"
import { ensureManifest } from "~features/extension-devtools/ensure-manifest"
import { generateIcons } from "~features/extension-devtools/generate-icons"
import { generateLocales } from "~features/extension-devtools/generate-locales"
import { getProjectPath } from "~features/extension-devtools/project-path"
import { createProjectWatcher } from "~features/extension-devtools/project-watcher"
import { printHeader } from "~features/helpers/print"

async function dev() {
  process.env.NODE_ENV = "development"

  const isImpulse = hasFlag("--impulse")

  printHeader()
  const [rawServePort = "1012", rawHmrPort = "1815"] = getNonFlagArgvs("dev")

  iLog("Starting the extension development server...")

  const commonPath = getCommonPath()
  const projectPath = getProjectPath(commonPath)

  // read typescript config file
  vLog("Make sure .plasmo exists")
  await ensureDir(commonPath.dotPlasmoDirectory)

  await generateIcons(commonPath)
  await generateLocales(commonPath)

  const plasmoManifest = await ensureManifest(commonPath, projectPath)

  const projectWatcher = isImpulse
    ? null
    : await createProjectWatcher(plasmoManifest, projectPath)

  const { default: getPort } = await import("get-port")

  const [servePort, hmrPort] = await Promise.all([
    getPort({ port: parseInt(rawServePort) }),
    getPort({ port: parseInt(rawHmrPort) })
  ])

  vLog(`Starting dev server on ${servePort}, HMR on ${hmrPort}...`)

  // TODO: Make this more dynamic
  const buildType = "chrome-mv3-dev"
  const distDir = resolve(commonPath.buildDirectory, buildType)

  await emptyDir(distDir)

  const bundler = new Parcel({
    cacheDir: resolve(commonPath.cacheDirectory, "parcel"),
    entries: commonPath.entryManifestPath,
    config: require.resolve("@plasmohq/parcel-config"),
    logLevel: "verbose",
    serveOptions: {
      host: "localhost",
      port: servePort
    },
    hmrOptions: {
      host: "localhost",
      port: hmrPort
    },
    shouldAutoInstall: true,
    defaultTargetOptions: {
      engines: {
        browsers: ["last 1 Chrome version"]
      },
      distDir
    },
    env: plasmoManifest.envConfig.plasmoPublicEnv
  })

  const { default: chalk } = await import("chalk")

  const bundlerWatcher = await bundler.watch((err, event) => {
    if (err) {
      throw err
    }

    if (event.type === "buildSuccess") {
      iLog(`✨ Extension reloaded in ${event.buildTime}ms!`)
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
