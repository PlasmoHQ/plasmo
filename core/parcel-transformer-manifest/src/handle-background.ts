import { getJSONSourceLocation } from "@parcel/diagnostic"

import { vLog } from "@plasmo/utils/logging"

import { cspPatchHMR } from "./csp-patch-hmr"
import type { MV2Data, MV3Data } from "./schema"
import { checkMV2, getState } from "./state"

export const handleBackground = () => {
  const { program } = getState()
  const isMV2 = checkMV2(program)
  if (isMV2) {
    handleMV2Background(program)
  } else {
    handleMV3Background(program)
  }
}

const defaultBackgroundScriptPath = "../runtime/plasmo-default-background.ts"

function handleMV2Background(program: MV2Data) {
  handleMV2BackgroundScript(program)
  handleMV2HotCsp(program)
}

function handleMV3Background(program: MV3Data) {
  const { env } = getState()

  const isFirefox =
    env.PLASMO_BROWSER === "firefox" || env.PLASMO_BROWSER === "gecko"

  // Handle Firefox preliminary MV3 support:
  if (isFirefox) {
    handleFirefoxMV3Background(program)
    return
  }

  handleMV3BackgroundServiceWorker(program)
  handleMV3HotCsp(program)
}

function handleFirefoxMV3Background(program: MV3Data) {
  const mv2Program = program as unknown as MV2Data
  if (program.background?.service_worker) {
    mv2Program.background = {
      scripts: [program.background.service_worker]
    }
  }

  handleMV2BackgroundScript(mv2Program)
  handleMV3HotCsp(program)
}

function handleMV2BackgroundScript(program: MV2Data) {
  const { hot, asset } = getState()
  vLog(`Handling background scripts`)

  if (program.background?.scripts) {
    program.background.scripts = program.background.scripts.map((bgScript) =>
      asset.addURLDependency(bgScript, {
        bundleBehavior: "isolated",
        needsStableName: true
      })
    )
  }

  if (hot) {
    if (!program.background?.scripts) {
      program.background = {
        scripts: [
          asset.addURLDependency(defaultBackgroundScriptPath, {
            resolveFrom: __filename
          })
        ]
      }
    }
  }
}

function handleMV3BackgroundServiceWorker(program: MV3Data) {
  const { hot, asset, filePath, ptrs } = getState()
  vLog(`Handling background scripts`)

  if (program.background?.service_worker) {
    vLog(`Handling background service worker`)
    program.background.service_worker = asset.addURLDependency(
      program.background.service_worker,
      {
        bundleBehavior: "isolated",
        needsStableName: true,
        loc: {
          filePath,
          ...getJSONSourceLocation(ptrs["/background/service_worker"], "value")
        },
        env: {
          context: "web-worker"
        }
      }
    )

    // Since we bundle everything, and sw import is static (not async), we can ignore type module.
    if (!!program.background.type) {
      delete program.background.type
    }
  }

  if (hot) {
    if (!program.background) {
      program.background = {
        service_worker: asset.addURLDependency(defaultBackgroundScriptPath, {
          resolveFrom: __filename,
          env: {
            context: "web-worker"
          }
        })
      }
    }
  }
}

function handleMV2HotCsp(program: MV2Data) {
  const { hot } = getState()

  if (hot) {
    // To enable HMR, we must override the CSP to allow 'unsafe-eval'
    program.content_security_policy = cspPatchHMR(
      program.content_security_policy
    )
  }
}

// Enable eval HMR for sandbox,
function handleMV3HotCsp(program: MV3Data) {
  const { hot } = getState()

  if (hot) {
    const csp = program.content_security_policy || {}
    csp.extension_pages = cspPatchHMR(csp.extension_pages, `http://localhost`)
    // Sandbox allows eval by default
    if (csp.sandbox) {
      csp.sandbox = cspPatchHMR(csp.sandbox)
    }
    program.content_security_policy = csp
  }
}
