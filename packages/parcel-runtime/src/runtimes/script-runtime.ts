import { vLog } from "@plasmo/utils/logging"

import { runtimeData } from "../utils/0-patch-module"
import { isDependencyOfBundle } from "../utils/hmr-check"
import { injectBuilderSocket, injectHmrSocket } from "../utils/inject-socket"

const scriptPort = chrome.runtime.connect({
  name: `__plasmo_runtime_script_${module.id}__`
})

const state = {
  buildReady: false,
  hmrRequestedReload: false
}

function consolidateUpdate() {
  if (state.hmrRequestedReload && state.buildReady) {
    vLog("Script Runtime - on should reload")
    try {
      scriptPort.postMessage({
        __plasmo_full_reload__: true
      })
    } catch {}
    globalThis.location?.reload?.()
  }
}

injectBuilderSocket(async () => {
  vLog("Script runtime - on build repackaged")
  state.buildReady ||= true
  consolidateUpdate()
})

injectHmrSocket(async (updatedAssets) => {
  vLog("Script runtime - on updated assets", {
    module,
    runtimeData,
    updatedAssets
  })

  state.hmrRequestedReload ||= updatedAssets
    .filter((asset) => asset.envHash === runtimeData.envHash)
    .some((asset) => isDependencyOfBundle(module.bundle, asset.id))

  consolidateUpdate()
})
