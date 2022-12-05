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

  const assets = updatedAssets.filter(
    (asset) => asset.envHash === runtimeData.envHash
  )

  vLog({ module, runtimeData, updatedAssets, assets })

  const shouldReload = assets.some((asset) =>
    isDependencyOfBundle(module.bundle, asset.id)
  )

  vLog({ shouldReload })

  state.hmrRequestedReload ||= shouldReload

  if (state.hmrRequestedReload && state.buildReady) {
    try {
      scriptPort.postMessage({
        __plasmo_full_reload__: true
      })
    } catch {}
    globalThis.location?.reload?.()
  }
})
