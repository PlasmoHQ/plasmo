import type { HmrAsset, ParcelBundle } from "../types"
import { extCtx, getHostname, getPort } from "./0-patch-module"
import { getParents, hmrState } from "./hmr-check"

export function hmrDownload(asset: HmrAsset) {
  if (asset.type === "js") {
    if (typeof document !== "undefined") {
      const script = document.createElement("script")
      script.src = asset.url + "?t=" + Date.now()
      if (asset.outputFormat === "esmodule") {
        script.type = "module"
      }
      return new Promise<HTMLScriptElement>((resolve, reject) => {
        script.onload = () => resolve(script)
        script.onerror = reject
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
  const scriptsToRemove = supportsSourceURL
    ? []
    : await Promise.all(
        assets.map((asset) => {
          asset.url = extCtx.runtime.getURL(
            "/__parcel_hmr_proxy__?url=" +
              encodeURIComponent(asset.url + "?t=" + Date.now())
          )
          return hmrDownload(asset)
        })
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
    var links = document.querySelectorAll('link[rel="stylesheet"]')
    for (var i = 0; i < links.length; i++) {
      // $FlowFixMe[incompatible-type]
      var href /*: string */ = links[i].getAttribute("href")
      var hostname = getHostname()
      var servedFromHMRServer =
        hostname === "localhost"
          ? new RegExp(
              "^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):" + getPort()
            ).test(href)
          : href.indexOf(hostname + ":" + getPort())
      var absolute =
        /^https?:\/\//i.test(href) &&
        href.indexOf(location.origin) !== 0 &&
        !servedFromHMRServer
      if (!absolute) {
        updateLink(links[i])
      }
    }

    cssTimeout = null
  }, 50)
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

export function hmrAcceptRun(bundle: ParcelBundle, id: string) {
  let cached = bundle.cache[id]
  bundle.hotData = {}
  if (cached && cached.hot) {
    cached.hot.data = bundle.hotData
  }

  if (cached && cached.hot && cached.hot._disposeCallbacks.length) {
    cached.hot._disposeCallbacks.forEach(function (cb) {
      cb(bundle.hotData)
    })
  }

  delete bundle.cache[id]

  bundle(id)

  cached = bundle.cache[id]

  if (cached && cached.hot && cached.hot._acceptCallbacks.length) {
    const parents = getParents(module.bundle.root, id)

    cached.hot._acceptCallbacks.forEach(function (cb) {
      cb(() => parents)
    })
  }

  hmrState.acceptedAssets[id] = true
}
