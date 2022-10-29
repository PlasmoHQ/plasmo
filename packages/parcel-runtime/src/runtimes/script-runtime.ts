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

    // console.log({ assets })

    if (assets.length === 0) {
      return
    }

    const canHmr = assets.every(
      (asset) =>
        asset.type === "js" &&
        hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle)
    )

    // console.log({ runtimeData, module })

    if (canHmr) {
      return
    }

    // script-runtime cannot HMR, skipping this update cycle
    // if (runtimeData.isReact) {
    //   if (
    //     typeof globalThis.window !== "undefined" &&
    //     typeof CustomEvent !== "undefined"
    //   ) {
    //     window.dispatchEvent(new CustomEvent("parcelhmraccept"))
    //   }

    //   try {
    //     await hmrApplyUpdates(assets)
    //     for (const [asset, id] of hmrState.assetsToAccept) {
    //       if (!hmrState.acceptedAssets[id]) {
    //         hmrAcceptRun(asset, id)
    //       }
    //     }
    //     return
    //   } catch {}
    // }

    scriptPort.postMessage({
      __plasmo_full_reload__: true
    })

    globalThis.location?.reload?.()
  })
}

// if (runtimeData.isReact) {
//   injectReactRefresh()
// }
