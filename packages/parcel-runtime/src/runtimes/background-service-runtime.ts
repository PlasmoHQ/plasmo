/**
 * This runtime is injected into the background service worker
 */
import { vLog } from "@plasmo/utils/logging"

import type { BackgroundMessage } from "../types"
import { extCtx, runtimeData } from "../utils/0-patch-module"
import { pollingDevServer } from "../utils/bgsw"
import { isDependencyOfBundle } from "../utils/hmr-check"
import { injectBuilderSocket, injectHmrSocket } from "../utils/inject-socket"

const parent = module.bundle.parent

const state = {
  buildReady: false,
  hmrUpdated: false,
  csCodeChanged: false,
  ports: new Set<chrome.runtime.Port>()
}

function consolidateUpdate(forced = false) {
  if (
    forced ||
    (state.buildReady && (state.hmrUpdated || state.csCodeChanged))
  ) {
    vLog("BGSW Runtime - reloading")
    extCtx.runtime.reload()
    for (const port of state.ports) {
      port.postMessage({
        __plasmo_cs_reload__: true
      })
    }
  }
}

if (!parent || !parent.isParcelRequire) {
  const hmrSocket = injectHmrSocket(async (updatedAssets) => {
    vLog("BGSW Runtime - On HMR Update")

    state.hmrUpdated ||= updatedAssets
      .filter((asset) => asset.envHash === runtimeData.envHash)
      .some((asset) => isDependencyOfBundle(module.bundle, asset.id))

    const manifestChange = updatedAssets.find((e) => e.type === "json")

    if (!!manifestChange) {
      const changedIdSet = new Set(updatedAssets.map((e) => e.id))

      const deps = Object.values(manifestChange.depsByBundle)
        .map((o) => Object.values(o))
        .flat()

      state.hmrUpdated ||= deps.every((dep) => changedIdSet.has(dep))
    }

    consolidateUpdate()
  })

  hmrSocket.addEventListener("open", () => {
    // Send a ping event to the HMR server every 24 seconds to keep the connection alive
    const interval = setInterval(() => hmrSocket.send("ping"), 24_000)
    hmrSocket.addEventListener("close", () => clearInterval(interval))
  })

  hmrSocket.addEventListener("close", async () => {
    await pollingDevServer()
    consolidateUpdate(true)
  })
}

injectBuilderSocket(async () => {
  vLog("BGSW Runtime - On Build Repackaged")
  // maybe we should wait for a bit until we determine if the build is truly ready
  state.buildReady ||= true
  consolidateUpdate()
})

extCtx.runtime.onConnect.addListener(function (port) {
  if (port.name.startsWith("__plasmo_runtime_script_")) {
    state.ports.add(port)
    port.onDisconnect.addListener(() => {
      state.ports.delete(port)
    })

    port.onMessage.addListener(function (msg: BackgroundMessage) {
      if (msg.__plasmo_cs_changed__) {
        vLog("BGSW Runtime - On CS code changed")
        state.csCodeChanged ||= true
        consolidateUpdate()
      }
    })
  }
})

extCtx.runtime.onMessage.addListener(function runtimeMessageHandler(
  msg: BackgroundMessage
) {
  if (msg.__plasmo_full_reload__) {
    vLog("BGSW Runtime - On top-level code changed")
    consolidateUpdate(true)
  }

  return true
})
