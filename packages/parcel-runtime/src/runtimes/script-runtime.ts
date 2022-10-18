import { runtimeData } from "./0-patch-module"
import { injectHmrSocket } from "./hmr"
import { hmrAcceptCheck } from "./hmr-check"

const parent = module.bundle.parent

if (!parent || !parent.isParcelRequire) {
  const scriptPort = chrome.runtime.connect({
    name: `__plasmo_runtime_script_${module.id}__`
  })

  injectHmrSocket(async (updatedAssets) => {
    // make sure it's relevant to this script
    const assets = updatedAssets.filter(
      (asset) => asset.envHash === runtimeData.envHash
    )

    if (assets.length === 0) {
      return
    }

    const canHmr = assets.every(
      (asset) =>
        asset.type === "js" &&
        hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle)
    )
    // script-runtime cannot HMR, skipping this update cycle
    if (canHmr) {
      return
    }

    scriptPort.postMessage({
      __plasmo_full_reload__: true
    })

    globalThis.location?.reload?.()
  })
}
