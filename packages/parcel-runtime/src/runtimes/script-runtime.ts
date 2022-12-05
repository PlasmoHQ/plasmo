import { vLog } from "@plasmo/utils/logging"

import { runtimeData } from "../utils/0-patch-module"
import { isDependencyOfBundle } from "../utils/hmr-check"
import { injectSocket } from "../utils/inject-socket"

const scriptPort = chrome.runtime.connect({
  name: `__plasmo_runtime_script_${module.id}__`
})

const state = {
  buildReady: false,
  hmrRequestedReload: false
}

injectSocket(async (updatedAssets, buildReady = false) => {
  state.buildReady ||= buildReady

  vLog({ module, runtimeData, updatedAssets })

  state.hmrRequestedReload ||= updatedAssets
    .filter((asset) => asset.envHash === runtimeData.envHash)
    .some((asset) => isDependencyOfBundle(module.bundle, asset.id))

  if (state.hmrRequestedReload && state.buildReady) {
    try {
      scriptPort.postMessage({
        __plasmo_full_reload__: true
      })
    } catch {}
    globalThis.location?.reload?.()
  }
})
