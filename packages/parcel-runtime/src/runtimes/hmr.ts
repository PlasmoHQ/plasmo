import { eLog, iLog, wLog } from "@plasmo/utils/logging"

import type { HmrAsset, HmrMessage } from "../types"
import {
  extCtx,
  getHostname,
  getPort,
  runtimeData,
  triggerReload
} from "./0-patch-module"

export function injectHmrSocket(
  onUpdate?: (assets: Array<HmrAsset>) => Promise<void>
) {
  if (typeof globalThis.WebSocket === "undefined") {
    return
  }

  const hostname = getHostname()
  const port = getPort()
  const protocol =
    runtimeData.secure ||
    (location.protocol === "https:" &&
      !/localhost|127.0.0.1|0.0.0.0/.test(hostname))
      ? "wss"
      : "ws"

  // If there's an error it's probably because of a race
  // between this content script and the extension reloading
  if (extCtx?.runtime?.lastError) {
    location.reload()
  }

  // WebSocket will automatically reconnect if the connection is lost. (i.e. restarting `plasmo dev`)
  const ws = new WebSocket(`${protocol}://${hostname}:${port}/`)

  ws.onmessage = async function (event) {
    const data = JSON.parse(event.data) as HmrMessage

    if (data.type === "update") {
      if (data.assets.some((e) => e.type === "json")) {
        // Manifest changed
        await triggerReload(true)
      } else if (typeof onUpdate === "function") {
        await onUpdate(data.assets)
      }
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
  }

  ws.onerror = function (e: ErrorEvent) {
    if (typeof e.message === "string") {
      eLog("[plasmo/parcel-runtime]: " + e.message)
    }
  }

  ws.onopen = function () {
    iLog("[plasmo/parcel-runtime]: Connected to HMR server")
  }

  ws.onclose = function () {
    wLog("[plasmo/parcel-runtime]: Connection to the HMR server is closed.")
  }
}
