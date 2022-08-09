import { getJSONSourceLocation } from "@parcel/diagnostic"

import { cspPatchHMR } from "./csp-patch-hmr"
import type { MV2Data, MV3Data } from "./schema"
import { checkMV2, state } from "./state"

export const handleBackground = () => {
  const { program } = state

  const isMV2 = checkMV2(program)

  if (isMV2) {
    handleMV2Background(program)
  } else {
    handleMV3Background(program)
  }
}

function handleMV2Background(program: MV2Data) {
  const { hot, asset, filePath, ptrs, needRuntimeBG } = state

  if (program.background?.page) {
    program.background.page = asset.addURLDependency(program.background.page, {
      bundleBehavior: "isolated",
      loc: {
        filePath,
        ...getJSONSourceLocation(ptrs["/background/page"], "value")
      }
    })

    if (needRuntimeBG) {
      asset.meta.webextBGInsert = program.background.page
    }
  }

  if (hot) {
    // To enable HMR, we must override the CSP to allow 'unsafe-eval'
    program.content_security_policy = cspPatchHMR(
      program.content_security_policy
    )

    if (needRuntimeBG && !program.background?.page) {
      if (!program.background) {
        program.background = {}
      }

      if (!program.background.scripts) {
        program.background.scripts = []
      }

      if (program.background.scripts.length == 0) {
        program.background.scripts.push(
          asset.addURLDependency("../runtime/default-bg.js", {
            resolveFrom: __filename
          })
        )
      }

      asset.meta.webextBGInsert = program.background.scripts[0]
    }
  }
}

function handleMV3Background(program: MV3Data) {
  const { hot, asset, filePath, ptrs, needRuntimeBG, hmrOptions } = state

  if (program.background?.service_worker) {
    program.background.service_worker = asset.addURLDependency(
      program.background.service_worker,
      {
        bundleBehavior: "isolated",
        loc: {
          filePath,
          ...getJSONSourceLocation(ptrs["/background/service_worker"], "value")
        },
        env: {
          context: "service-worker",
          sourceType: program.background.type == "module" ? "module" : "script"
        }
      }
    )
  }

  if (hot) {
    // Enable eval HMR for sandbox,
    const csp = program.content_security_policy || {}
    csp.extension_pages = cspPatchHMR(
      csp.extension_pages,
      `http://${hmrOptions?.host || "localhost"}`
    )
    // Sandbox allows eval by default
    if (csp.sandbox) csp.sandbox = cspPatchHMR(csp.sandbox)
    program.content_security_policy = csp

    if (needRuntimeBG) {
      if (!program.background) {
        program.background = {} as any
      }

      if (!program.background.service_worker) {
        program.background.service_worker = asset.addURLDependency(
          "../runtime/default-bg.js",
          {
            resolveFrom: __filename,
            env: {
              context: "service-worker"
            }
          }
        )
      }

      asset.meta.webextBGInsert = program.background.service_worker
    }
  }
}
