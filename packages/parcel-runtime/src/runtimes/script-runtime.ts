import { vLog } from "@plasmo/utils/logging"

import { runtimeData } from "../utils/0-patch-module"
import { isDependencyOfBundle } from "../utils/hmr-check"
import { injectSocket } from "../utils/inject-socket"

const scriptPort = chrome.runtime.connect({
  name: `__plasmo_runtime_script_${module.id}__`
})

injectSocket(async (updatedAssets) => {
  // make sure it's relevant to this script
  const assets = updatedAssets.filter(
    (asset) => asset.envHash === runtimeData.envHash
  )

  vLog({ module, runtimeData, updatedAssets, assets })

  if (assets.length === 0) {
    return
  }

  const shouldReload = assets.every((asset) =>
    isDependencyOfBundle(module.bundle, asset.id)
  )

  vLog({ shouldReload })

  if (shouldReload) {
    try {
      scriptPort.postMessage({
        __plasmo_full_reload__: true
      })
    } catch {}

    globalThis.location?.reload?.()
  }
})
