/**
 * This runtime is injected into the background service worker
 */
import { vLog } from "@plasmo/utils/logging"

import { keepAlive } from "@plasmohq/persistent/background"

import type { BackgroundMessage } from "../types"
import {
  PAGE_PORT_PREFIX,
  SCRIPT_PORT_PREFIX,
  extCtx,
  runtimeData
} from "../utils/0-patch-module"
import { pollingDevServer } from "../utils/bgsw"
import { isDependencyOfBundle } from "../utils/hmr-check"
import { injectBuilderSocket, injectHmrSocket } from "../utils/inject-socket"

const parent = module.bundle.parent

const state = {
  buildReady: false,
  bgChanged: false,
  csChanged: false,
  pageChanged: false,
  scriptPorts: new Set<chrome.runtime.Port>(),
  pagePorts: new Set<chrome.runtime.Port>()
}

async function consolidateUpdate(forced = false) {
  if (forced || (state.buildReady && state.pageChanged)) {
    vLog("BGSW Runtime - reloading Page")
    for (const port of state.pagePorts) {
      // Mark the active tab for specific reload
      port.postMessage(null)
    }
  }

  if (forced || (state.buildReady && (state.bgChanged || state.csChanged))) {
    vLog("BGSW Runtime - reloading CS")
    const activeTabList = await extCtx?.tabs.query({ active: true })

    for (const port of state.scriptPorts) {
      const isActive = activeTabList.some((t) => t.id === port.sender.tab?.id)
      // Mark the active tab for specific reload
      port.postMessage({
        __plasmo_cs_active_tab__: isActive
      } as BackgroundMessage)
    }
    // Required to actually reload the CS
    extCtx.runtime.reload()
  }
}

if (!parent || !parent.isParcelRequire) {
  keepAlive()

  const hmrSocket = injectHmrSocket(async (updatedAssets) => {
    vLog("BGSW Runtime - On HMR Update")

    state.bgChanged ||= updatedAssets
      .filter((asset) => asset.envHash === runtimeData.envHash)
      .some((asset) => isDependencyOfBundle(module.bundle, asset.id))

    const manifestChange = updatedAssets.find((e) => e.type === "json")

    if (!!manifestChange) {
      const changedIdSet = new Set(updatedAssets.map((e) => e.id))

      const deps = Object.values(manifestChange.depsByBundle)
        .map((o) => Object.values(o))
        .flat()

      state.bgChanged ||= deps.every((dep) => changedIdSet.has(dep))
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
  const isPagePort = port.name.startsWith(PAGE_PORT_PREFIX)
  const isScriptPort = port.name.startsWith(SCRIPT_PORT_PREFIX)

  if (isPagePort || isScriptPort) {
    const portSet = isPagePort ? state.pagePorts : state.scriptPorts

    portSet.add(port)

    port.onDisconnect.addListener(() => {
      portSet.delete(port)
    })

    port.onMessage.addListener(function (msg: BackgroundMessage) {
      vLog("BGSW Runtime - On source changed", msg)
      if (msg.__plasmo_cs_changed__) {
        state.csChanged ||= true
      }

      if (msg.__plasmo_page_changed__) {
        state.pageChanged ||= true
      }

      consolidateUpdate()
    })
  }
})

extCtx.runtime.onMessage.addListener(function runtimeMessageHandler(
  msg: BackgroundMessage
) {
  if (msg.__plasmo_full_reload__) {
    vLog("BGSW Runtime - On top-level code changed")
    consolidateUpdate()
  }

  return true
})
