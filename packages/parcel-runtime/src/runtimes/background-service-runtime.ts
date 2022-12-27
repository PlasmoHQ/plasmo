import { vLog } from "@plasmo/utils/logging"

import type { BackgroundMessage } from "../types"

import "../utils/0-patch-module"

import { extCtx, runtimeData } from "../utils/0-patch-module"
import { isDependencyOfBundle } from "../utils/hmr-check"
import { injectBuilderSocket, injectHmrSocket } from "../utils/inject-socket"

const parent = module.bundle.parent

const state = {
  buildReady: false,
  hmrRequestedReload: false
}

function consolidateUpdate() {
  if (state.hmrRequestedReload && state.buildReady) {
    vLog("BGSW Runtime - reloading")
    extCtx.runtime.reload()
  }
}

injectBuilderSocket(async () => {
  vLog("BGSW Runtime - on build repackaged")
  state.buildReady ||= true
  consolidateUpdate()
})

if (!parent || !parent.isParcelRequire) {
  injectHmrSocket(async (updatedAssets) => {
    vLog("Background Service Runtime - On HMR Update")

    state.hmrRequestedReload ||= updatedAssets
      .filter((asset) => asset.envHash === runtimeData.envHash)
      .some((asset) => isDependencyOfBundle(module.bundle, asset.id))

    const manifestChange = updatedAssets.find((e) => e.type === "json")

    if (!!manifestChange) {
      const changedIdSet = new Set(updatedAssets.map((e) => e.id))

      const deps = Object.values(manifestChange.depsByBundle)
        .map((o) => Object.values(o))
        .flat()

      state.hmrRequestedReload ||= deps.every((dep) => changedIdSet.has(dep))
    }

    consolidateUpdate()
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
  if (port.name.startsWith("__plasmo_runtime_script_")) {
    port.onMessage.addListener((msg, p) => {
      if (msg.__plasmo_full_reload__) {
        try {
          extCtx.runtime.reload()
        } catch {
        } finally {
          // Maybe CSUI should not call BGSW, but BGSW tell it file changed instead for the DOM reload.
        }
      }
    })
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
