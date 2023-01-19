import { vLog } from "@plasmo/utils/logging"

import { runtimeData, triggerReload } from "../utils/0-patch-module"
import { hmrAcceptCheck, hmrState, resetHmrState } from "../utils/hmr-check"
import { hmrAccept, hmrApplyUpdates, hmrDispose } from "../utils/hmr-utils"
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

      // Some quirky shit happening here:
      const canHmr = assets.some(
        (asset) =>
          asset.type === "css" ||
          (asset.type === "js" &&
            hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle))
      )

      if (canHmr) {
        try {
          await hmrApplyUpdates(assets)

          // Dispose all old assets.
          const disposedAssets = {} as Record<string, boolean>

          for (const [asset, id] of hmrState.assetsToDispose) {
            if (!disposedAssets[id]) {
              hmrDispose(asset, id)
              disposedAssets[id] = true
            }
          }

          const acceptedAssets = {} as Record<string, boolean>

          for (let i = 0; i < hmrState.assetsToAccept.length; i++) {
            const [asset, id] = hmrState.assetsToAccept[i]
            if (!acceptedAssets[id]) {
              hmrAccept(asset, id)
              acceptedAssets[id] = true
            }
          }
        } catch (e) {
          if (runtimeData.verbose === "true") {
            console.trace(e)
            alert(JSON.stringify(e))
          }
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
