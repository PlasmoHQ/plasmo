import type { HmrAsset, ParcelAsset, ParcelBundle } from "../types"
import { extCtx, getHostname, getPort } from "./0-patch-module"
import { getParents, hmrState } from "./hmr-check"

export function hmrDownload(asset: HmrAsset) {
  if (asset.type === "js") {
    if (typeof document !== "undefined") {
      return new Promise<HTMLScriptElement>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = `${asset.url}?t=${Date.now()}`

        if (asset.outputFormat === "esmodule") {
          script.type = "module"
        }

        script.addEventListener("load", () => resolve(script))

        script.addEventListener("error", () =>
          reject(new Error(`Failed to download asset: ${asset.id}`))
        )

        document.head?.appendChild(script)
      })
    }
  }
}

let supportsSourceURL = false
try {
  ;(0, eval)('throw new Error("test"); //# sourceURL=test.js')
} catch (err) {
  supportsSourceURL = err.stack.includes("test.js")
}

export async function hmrApplyUpdates(assets: Array<HmrAsset>) {
  global.parcelHotUpdate = Object.create(null)

  // If sourceURL comments aren't supported in eval, we need to load
  // the update from the dev server over HTTP so that stack traces
  // are correct in errors/logs. This is much slower than eval, so
  // we only do it if needed (currently just Safari).
  // https://bugs.webkit.org/show_bug.cgi?id=137297
  // This path is also taken if a CSP disallows eval.

  assets.forEach((asset) => {
    asset.url = extCtx.runtime.getURL(
      "/__plasmo_hmr_proxy__?url=" +
        encodeURIComponent(`${asset.url}?t=${Date.now()}`)
    )
  })

  const scriptsToRemove = await Promise.all(
    supportsSourceURL ? [] : assets.map(hmrDownload)
  )

  try {
    assets.forEach(function (asset) {
      hmrApply(module.bundle.root, asset)
    })
  } finally {
    delete global.parcelHotUpdate
    if (scriptsToRemove) {
      scriptsToRemove.forEach((script) => {
        if (script) {
          document.head?.removeChild(script)
        }
      })
    }
  }
}

function updateLink(link: Element) {
  const newLink = link.cloneNode() as HTMLLinkElement

  newLink.onload = function () {
    if (link.parentNode !== null) {
      link.parentNode.removeChild(link)
    }
  }
  newLink.setAttribute(
    "href",
    link.getAttribute("href").split("?")[0] + "?" + Date.now()
  )

  link.parentNode.insertBefore(newLink, link.nextSibling)
}

let cssTimeout = null
function reloadCSS() {
  if (cssTimeout) {
    return
  }

  cssTimeout = setTimeout(function () {
    const links = document.querySelectorAll('link[rel="stylesheet"]')
    for (var i = 0; i < links.length; i++) {
      const href = links[i].getAttribute("href")
      const hostname = getHostname()

      const servedFromHmrServer =
        hostname === "localhost"
          ? new RegExp(
              "^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):" + getPort()
            ).test(href)
          : href.indexOf(hostname + ":" + getPort())

      const absolute =
        /^https?:\/\//i.test(href) &&
        href.indexOf(location.origin) !== 0 &&
        !servedFromHmrServer

      if (!absolute) {
        updateLink(links[i])
      }
    }

    cssTimeout = null
  }, 47)
}

function hmrApply(bundle: ParcelBundle, asset: HmrAsset) {
  const { modules } = bundle
  if (!modules) {
    return
  }

  if (asset.type === "css") {
    reloadCSS()
  } else if (asset.type === "js") {
    const deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID]

    if (deps) {
      if (modules[asset.id]) {
        // Remove dependencies that are removed and will become orphaned.
        // This is necessary so that if the asset is added back again, the cache is gone, and we prevent a full page reload.
        // debugger
        let oldDeps = modules[asset.id][1]
        for (let dep in oldDeps) {
          if (!deps[dep] || deps[dep] !== oldDeps[dep]) {
            let id = oldDeps[dep]
            let parents = getParents(module.bundle.root, id)
            if (parents.length === 1) {
              hmrDelete(module.bundle.root, id)
            }
          }
        }
      }

      if (supportsSourceURL) {
        // Global eval. We would use `new Function` here but browser
        // support for source maps is better with eval.
        ;(0, eval)(asset.output)
      }

      const fn = global.parcelHotUpdate[asset.id]
      modules[asset.id] = [fn, deps]
    } else if (bundle.parent) {
      hmrApply(bundle.parent, asset)
    }
  }
}

function hmrDelete(bundle: ParcelBundle, id: string) {
  let modules = bundle.modules
  if (!modules) {
    return
  }

  if (modules[id]) {
    // Collect dependencies that will become orphaned when this module is deleted.
    let deps = modules[id][1]
    let orphans = []
    for (let dep in deps) {
      let parents = getParents(module.bundle.root, deps[dep])
      if (parents.length === 1) {
        orphans.push(deps[dep])
      }
    }

    // Delete the module. This must be done before deleting dependencies in case of circular dependencies.
    delete modules[id]
    delete bundle.cache[id]

    // Now delete the orphans.
    orphans.forEach((id) => {
      hmrDelete(module.bundle.root, id)
    })
  } else if (bundle.parent) {
    hmrDelete(bundle.parent, id)
  }
}

export function hmrDispose(bundle: ParcelBundle, id: string) {
  const cached = bundle.cache[id]
  bundle.hotData[id] = {}
  if (cached && cached.hot) {
    cached.hot.data = bundle.hotData[id]
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData[id])
    })
  }

  delete bundle.cache[id]
}

export function hmrAccept(bundle: ParcelBundle, id: string) {
  // Execute the module
  bundle(id)

  const cached = bundle.cache[id]

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    const parents = getParents(module.bundle.root, id)
    cached.hot._acceptCallbacks.forEach(function (cb) {
      const assetsToAlsoAccept: ParcelAsset[] = cb(() => parents)

      if (assetsToAlsoAccept && assetsToAlsoAccept.length) {
        assetsToAlsoAccept.forEach(([extraAsset, extraAssetId]) => {
          hmrDispose(extraAsset, extraAssetId)
        })

        hmrState.assetsToAccept.push.apply(
          hmrState.assetsToAccept,
          assetsToAlsoAccept
        )
      }
    })
  }
}
