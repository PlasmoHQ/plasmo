import { eLog, iLog, wLog } from "@plasmo/utils/logging"
import { ReconnectingWebSocket } from "@plasmo/utils/websocket"

import { extCtx, getHostname, getPort, hmrData } from "./hmr-utils"
import type { HmrMessage } from "./types"

const parent = module.bundle.parent

const state = {
  reconnecting: true
}

if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== "undefined") {
  const hostname = getHostname()
  const port = getPort()
  const protocol =
    hmrData.secure ||
    (location.protocol === "https:" &&
      !/localhost|127.0.0.1|0.0.0.0/.test(hostname))
      ? "wss"
      : "ws"

  // If there's an error it's probably because of a race
  // between this content script and the extension reloading
  if (extCtx?.runtime?.lastError) {
    location.reload()
  }

  console.log(module)

  // WebSocket will automatically reconnect if the connection is lost. (i.e. restarting `plasmo dev`)
  const ws = new ReconnectingWebSocket(`${protocol}://${hostname}:${port}/`)

  ws.onmessage = async function (event) {
    if (!extCtx.runtime.id) {
      return
    }
    const data = JSON.parse(event.data) as HmrMessage

    if (data.type === "update") {
      console.log(data.assets)

      // if (data.assets.filter((e) => e.type === "json").length > 0) {
      //   // If it's a manifest change, we must reload the entire app
      //   if (typeof chrome?.runtime?.reload === "function") {
      //     chrome.runtime.reload()
      //   } else {
      //     // Content scripts can't reload the extension on their own
      //     // so we need to send a message to the background service worker
      //     // to do it for us, using Parcel's webextension runtime's background worker
      //     extension.runtime.sendMessage({ __parcel_hmr_reload__: true })
      //     location.reload()
      //   }
      // } else {
      //   // Otherwise, we check whether they have location.reload()
      //   // If they do, we reload the page. Otherwise, we reload the entire extension
      //   if (typeof location?.reload === "function") {
      //     location.reload()
      //   } else {
      //     extension.runtime.reload()
      //   }
      // }
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

  ws.onerror = function (e) {
    if (typeof e.message === "string" && !state.reconnecting) {
      eLog("[plasmo/parcel-runtime]: " + e.message)
    }
  }

  ws.onopen = function () {
    state.reconnecting = false
    iLog("[plasmo/parcel-runtime]: Connected to HMR server")
  }

  ws.onclose = function () {
    if (state.reconnecting) {
      return
    }
    state.reconnecting = true
    wLog(
      "[plasmo/parcel-runtime]: Connection to the HMR server was lost, trying to reconnect..."
    )
  }
}
