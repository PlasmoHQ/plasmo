import { eLog, iLog, wLog } from "@plasmo/utils/logging"

import type { HmrAsset, HmrMessage } from "../types"
import { extCtx, getHostname, getPort, runtimeData } from "./0-patch-module"

function getBaseSocketUri(port = getPort()) {
  const hostname = getHostname()
  const protocol =
    runtimeData.secure ||
    (location.protocol === "https:" &&
      !/localhost|127.0.0.1|0.0.0.0/.test(hostname))
      ? "wss"
      : "ws"

  // If there's an error it's probably because of a race
  // between this content script and the extension reloading
  if (extCtx?.runtime?.lastError) {
    globalThis?.location?.reload?.()
  }

  return `${protocol}://${hostname}:${port}/`
}

function wsErrorHandler(e: ErrorEvent) {
  if (typeof e.message === "string") {
    eLog("[plasmo/parcel-runtime]: " + e.message)
  }
}

export function injectBuilderSocket(onUpdate?: () => Promise<void>) {
  if (typeof globalThis.WebSocket === "undefined") {
    return
  }

  const builderWs = new WebSocket(getBaseSocketUri(Number(getPort()) + 1))

  builderWs.addEventListener("message", async function (event) {
    const data = JSON.parse(event.data) as HmrMessage
    if (data.type === "build_ready") {
      await onUpdate()
      return
    }
  })

  builderWs.addEventListener("error", wsErrorHandler)

  return builderWs
}

export function injectHmrSocket(
  onUpdate: (assets: Array<HmrAsset>) => Promise<void>
) {
  if (typeof globalThis.WebSocket === "undefined") {
    return
  }

  const hmrWs = new WebSocket(getBaseSocketUri())

  hmrWs.addEventListener("message", async function (event) {
    const data = JSON.parse(event.data) as HmrMessage

    if (data.type === "update") {
      await onUpdate(data.assets)
    }

    if (data.type === "error") {
      // Log parcel errors to console
      for (const ansiDiagnostic of data.diagnostics.ansi) {
        const stack = ansiDiagnostic.codeframe
          ? ansiDiagnostic.codeframe
          : ansiDiagnostic.stack

        wLog(
          "[plasmo/parcel-runtime]: " +
            ansiDiagnostic.message +
            "\n" +
            stack +
            "\n\n" +
            ansiDiagnostic.hints.join("\n")
        )
      }
    }
  })

  hmrWs.addEventListener("error", wsErrorHandler)

  hmrWs.addEventListener("open", () => {
    iLog(
      `[plasmo/parcel-runtime]: Connected to HMR server for ${runtimeData.entryFilePath}`
    )
  })

  hmrWs.addEventListener("close", () => {
    wLog(
      `[plasmo/parcel-runtime]: Connection to the HMR server is closed for ${runtimeData.entryFilePath}`
    )
  })

  return hmrWs
}
