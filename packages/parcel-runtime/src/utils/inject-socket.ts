import { eLog, iLog, wLog } from "@plasmo/utils/logging"

import type { HmrAsset, HmrMessage } from "../types"
import {
  extCtx,
  getHostname,
  getPort,
  runtimeData,
  triggerReload
} from "./0-patch-module"

export function injectSocket(
  onUpdate?: (assets: Array<HmrAsset>, buildReady?: boolean) => Promise<void>
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
  const wsBuilder = new WebSocket(
    `${protocol}://${hostname}:${parseInt(port as string) + 1}/`
  )

  wsBuilder.onmessage = async function (event) {
    const data = JSON.parse(event.data) as HmrMessage
    if (data.type === "build_ready") {
      await onUpdate?.([], true)
      return
    }
  }

  wsBuilder.onerror = function (e: ErrorEvent) {
    if (typeof e.message === "string") {
      eLog("[plasmo/build-watcher]: " + e.message)
    }
  }

  wsBuilder.onopen = function () {
    iLog(
      `[plasmo/build-watcher]: Connected to HMR server for ${runtimeData.entryFilePath}`
    )
  }

  wsBuilder.onclose = function () {
    wLog(
      `[plasmo/build-watcher]: Connection to the HMR server is closed for ${runtimeData.entryFilePath}`
    )
  }

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
    iLog(
      `[plasmo/parcel-runtime]: Connected to HMR server for ${runtimeData.entryFilePath}`
    )
  }

  ws.onclose = function () {
    wLog(
      `[plasmo/parcel-runtime]: Connection to the HMR server is closed for ${runtimeData.entryFilePath}`
    )
  }
}
