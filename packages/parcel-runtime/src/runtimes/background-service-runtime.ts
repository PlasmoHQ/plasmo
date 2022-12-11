import { vLog } from "@plasmo/utils/logging"

import type { BackgroundMessage } from "../types"

import "../utils/0-patch-module"

import { extCtx, runtimeData } from "../utils/0-patch-module"
import { injectHmrSocket } from "../utils/inject-socket"

const parent = module.bundle.parent

if (!parent || !parent.isParcelRequire) {
  injectHmrSocket(async (updatedAssets) => {
    const manifestChange = updatedAssets.find((e) => e.type === "json")
    if (!manifestChange) {
      return
    }

    const changedIdSet = new Set(updatedAssets.map((e) => e.id))

    const deps = Object.values(manifestChange.depsByBundle)
      .map((o) => Object.values(o))
      .flat()

    const shouldReload = deps.every((dep) => changedIdSet.has(dep))

    if (shouldReload) {
      extCtx.runtime.reload()
    }
  })
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
