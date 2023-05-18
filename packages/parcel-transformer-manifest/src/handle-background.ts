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
  const { hot, asset, filePath, ptrs } = getState()
  vLog(`Handling background scripts`)

  if (program.background?.page) {
    program.background.page = asset.addURLDependency(program.background.page, {
      bundleBehavior: "isolated",
      loc: {
        filePath,
        ...getJSONSourceLocation(ptrs["/background/page"], "value")
      }
    })
  }

  if (program.background?.scripts) {
    program.background.scripts = program.background.scripts.map((bgScript) =>
      asset.addURLDependency(bgScript, {
        bundleBehavior: "isolated"
      })
    )
  }

  if (hot) {
    // To enable HMR, we must override the CSP to allow 'unsafe-eval'
    program.content_security_policy = cspPatchHMR(
      program.content_security_policy
    )

    if (!program.background) {
      program.background = {}
    }

    if (!program.background?.scripts) {
      program.background.scripts = []
    }

    program.background.scripts.push(
      asset.addURLDependency(defaultBackgroundScriptPath, {
        resolveFrom: __filename
      })
    )
  }
}

function handleMV3Background(program: MV3Data) {
  const { hot, asset, filePath, ptrs, hmrOptions, env } = getState()

  vLog(`Handling background service worker`)
  if (program.background?.service_worker) {
    // Handle Firefox preliminary MV3 support:
    if (env.PLASMO_BROWSER === "firefox") {
      const mv2Program = program as unknown as MV2Data
      mv2Program.background.scripts = [program.background.service_worker]
      delete program.background.service_worker
      handleMV2Background(mv2Program)
      return
    }

    program.background.service_worker = asset.addURLDependency(
      program.background.service_worker,
      {
        bundleBehavior: "isolated",
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
    // Enable eval HMR for sandbox,
    const csp = program.content_security_policy || {}
    csp.extension_pages = cspPatchHMR(
      csp.extension_pages,
      `http://${hmrOptions?.host || "localhost"}`
    )
    // Sandbox allows eval by default
    if (csp.sandbox) {
      csp.sandbox = cspPatchHMR(csp.sandbox)
    }
    program.content_security_policy = csp

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
