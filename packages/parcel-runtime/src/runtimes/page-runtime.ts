import { vLog } from "@plasmo/utils/logging"

import { runtimeData, triggerReload } from "../utils/0-patch-module"
import { hmrAcceptCheck, hmrState, resetHmrState } from "../utils/hmr-check"
import { hmrAcceptRun, hmrApplyUpdates } from "../utils/hmr-utils"
import { injectHmrSocket } from "../utils/inject-socket"
import { injectReactRefresh } from "../utils/react-refresh"

const parent = module.bundle.parent

if (!parent || !parent.isParcelRequire) {
  injectHmrSocket(async (updatedAssets) => {
    vLog("Page runtime - On HMR Update")
    if (runtimeData.isReact) {
      resetHmrState()
      // Is an extension page, can try to hot reload
      const assets = updatedAssets.filter(
        (asset) => asset.envHash === runtimeData.envHash
      )

      const canHmr = assets.some(
        (asset) =>
          asset.type === "css" ||
          (asset.type === "js" &&
            hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle))
      )

      if (canHmr) {
        if (
          typeof globalThis.window !== "undefined" &&
          typeof CustomEvent !== "undefined"
        ) {
          window.dispatchEvent(new CustomEvent("parcelhmraccept"))
        }

        try {
          await hmrApplyUpdates(assets)

          for (const [asset, id] of hmrState.assetsToAccept) {
            if (!hmrState.acceptedAssets[id]) {
              hmrAcceptRun(asset, id)
            }
          }
        } catch {
          await triggerReload(true)
        }
      }
    } else {
      vLog("Page runtime - Reloading")
      await triggerReload()
    }
  })
}

if (runtimeData.isReact) {
  vLog("Injecting react refresh")
  injectReactRefresh()
}
