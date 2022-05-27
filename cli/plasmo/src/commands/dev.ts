import Parcel from "@parcel/core"
import { emptyDir, ensureDir } from "fs-extra"
import { resolve } from "path"

import { aLog, eLog, getNonFlagArgvs, iLog, vLog } from "@plasmo/utils"

import { getCommonPath } from "~features/extension-devtools/common-path"
import { ensureManifest } from "~features/extension-devtools/ensure-manifest"
import { generateIcons } from "~features/extension-devtools/generate-icons"
import { loadEnvConfig } from "~features/extension-devtools/parse-env"
import { getProjectPath } from "~features/extension-devtools/project-path"
import { createProjectWatcher } from "~features/extension-devtools/project-watcher"
import { getTemplatePath } from "~features/extension-devtools/template-path"
import { printHeader } from "~features/helpers/print"

async function dev() {
  printHeader()
  const [rawServePort = "1012", rawHmrPort = "1815"] = getNonFlagArgvs("dev")

  iLog("Starting the extension development server...")

  const commonPath = getCommonPath()
  const projectPath = getProjectPath(commonPath)
  const templatePath = getTemplatePath()

  // read typescript config file
  vLog("Make sure .plasmo exists")
  await ensureDir(commonPath.dotPlasmoDirectory)

  await generateIcons(commonPath)

  const plasmoManifest = await ensureManifest(commonPath, projectPath)

  const [projectWatcher, devEnvConfig] = await Promise.all([
    createProjectWatcher(plasmoManifest, projectPath),
    loadEnvConfig(commonPath.currentDirectory, true)
  ])

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
    logLevel: "verbose",
    serveOptions: {
      host: "localhost",
      port: servePort
    },
    config: templatePath.parcelConfig,
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
    env: devEnvConfig.plasmoPublicEnv
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
    projectWatcher.unsubscribe()
    bundlerWatcher.unsubscribe()
  }

  process.on("SIGINT", cleanup)
  process.on("SIGTERM", cleanup)
}

export default dev
