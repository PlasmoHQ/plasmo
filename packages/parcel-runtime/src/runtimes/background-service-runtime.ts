import type { BackgroundMessage } from "../types"

import "./0-patch-module"

import { extCtx, runtimeData } from "./0-patch-module"
import { injectHmrSocket } from "./hmr"

const parent = module.bundle.parent

if (!parent || !parent.isParcelRequire) {
  injectHmrSocket()
}

async function runtimeMessageHandler(msg: BackgroundMessage) {
  if (msg.__plasmo_full_reload__) {
    extCtx.runtime.reload()
  }

  return true
}

extCtx.runtime.onMessage.addListener(runtimeMessageHandler)

extCtx.runtime.onConnect.addListener(function (port) {
  if (port.name.startsWith("__plasmo_runtime_")) {
    port.onMessage.addListener(runtimeMessageHandler)
  }
})

if (extCtx.runtime.getManifest().manifest_version === 3) {
  const proxyLoc = extCtx.runtime.getURL("/__plasmo_hmr_proxy__?url=")

  addEventListener("fetch", function (evt: FetchEvent) {
    const reqUrl = evt.request.url
    if (reqUrl.startsWith(proxyLoc)) {
      const url = new URL(decodeURIComponent(reqUrl.slice(proxyLoc.length)))
      if (
        url.hostname === runtimeData.host &&
        url.port === `${runtimeData.port}`
      ) {
        evt.respondWith(
          fetch(url).then(
            (res) =>
              new Response(res.body, {
                headers: {
                  "Content-Type": res.headers.get("Content-Type")
                }
              })
          )
        )
      } else {
        evt.respondWith(
          new Response("Plasmo HMR", {
            status: 200,
            statusText: "Testing"
          })
        )
      }
    }
  })
}
