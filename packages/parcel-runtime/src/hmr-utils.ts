import type { ExtensionApi, HmrAsset, HmrData, ParcelRequire } from "./types"

export const hmrData = JSON.parse(`"__plasmo_hmr_data__"`) as HmrData

export const extCtx: ExtensionApi =
  globalThis.chrome || globalThis.browser || null

export function getHostname() {
  return (
    hmrData.host ||
    (location.protocol.indexOf("http") === 0 ? location.hostname : "localhost")
  )
}

export function getPort() {
  return hmrData.port || location.port
}

const OldModule = module.bundle.Module

function Module(moduleName) {
  OldModule.call(this, moduleName)
  this.hot = {
    data: module.bundle.hotData,
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {})
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn)
    }
  }
  module.bundle.hotData = undefined
}

module.bundle.Module = Module

const checkedAssets = {} as Record<string, boolean>
const acceptedAssets = {} as Record<string, boolean>
const assetsToAccept = [] as Array<[ParcelRequire, string]>

export function hmrDownload(asset: HmrAsset) {
  if (asset.type === "js") {
    if (typeof document !== "undefined") {
      let script = document.createElement("script")
      script.src = asset.url + "?t=" + Date.now()
      if (asset.outputFormat === "esmodule") {
        script.type = "module"
      }
      return new Promise<HTMLScriptElement>((resolve, reject) => {
        script.onload = () => resolve(script)
        script.onerror = reject
        document.head?.appendChild(script)
      })
    } else if (typeof importScripts === "function") {
      // Worker scripts
      if (asset.outputFormat === "esmodule") {
        return __parcel__import__(asset.url + "?t=" + Date.now())
      } else {
        return new Promise((resolve, reject) => {
          try {
            __parcel__importScripts__(asset.url + "?t=" + Date.now())
            resolve(null)
          } catch (err) {
            reject(err)
          }
        })
      }
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

  let scriptsToRemove
  try {
    // If sourceURL comments aren't supported in eval, we need to load
    // the update from the dev server over HTTP so that stack traces
    // are correct in errors/logs. This is much slower than eval, so
    // we only do it if needed (currently just Safari).
    // https://bugs.webkit.org/show_bug.cgi?id=137297
    // This path is also taken if a CSP disallows eval.
    if (!supportsSourceURL) {
      let promises = assets.map((asset) =>
        hmrDownload(asset)?.catch((err) => {
          // Web extension bugfix for Chromium
          // https://bugs.chromium.org/p/chromium/issues/detail?id=1255412#c12
          if (
            extCtx &&
            extCtx.runtime &&
            extCtx.runtime.getManifest().manifest_version == 3
          ) {
            if (
              typeof ServiceWorkerGlobalScope != "undefined" &&
              global instanceof ServiceWorkerGlobalScope
            ) {
              extCtx.runtime.reload()
              return
            }
            asset.url = extCtx.runtime.getURL(
              "/__parcel_hmr_proxy__?url=" +
                encodeURIComponent(asset.url + "?t=" + Date.now())
            )
            return hmrDownload(asset)
          }
          throw err
        })
      )

      scriptsToRemove = await Promise.all(promises)
    }

    assets.forEach(function (asset) {
      hmrApply(module["bundle"].root, asset)
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
      // $FlowFixMe
      link.parentNode.removeChild(link)
    }
  }
  newLink.setAttribute(
    "href",
    // $FlowFixMe
    link.getAttribute("href").split("?")[0] + "?" + Date.now()
  )
  // $FlowFixMe
  link.parentNode.insertBefore(newLink, link.nextSibling)
}

var cssTimeout = null
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

function hmrApply(bundle: ParcelRequire, asset: HmrAsset) {
  var modules = bundle.modules
  if (!modules) {
    return
  }

  if (asset.type === "css") {
    reloadCSS()
  } else if (asset.type === "js") {
    let deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID]
    if (deps) {
      if (modules[asset.id]) {
        // Remove dependencies that are removed and will become orphaned.
        // This is necessary so that if the asset is added back again, the cache is gone, and we prevent a full page reload.
        let oldDeps = modules[asset.id][1]
        for (let dep in oldDeps) {
          if (!deps[dep] || deps[dep] !== oldDeps[dep]) {
            let id = oldDeps[dep]
            let parents = getParents(module["bundle"].root, id)
            if (parents.length === 1) {
              hmrDelete(module["bundle"].root, id)
            }
          }
        }
      }

      if (supportsSourceURL) {
        // Global eval. We would use `new Function` here but browser
        // support for source maps is better with eval.
        ;(0, eval)(asset.output)
      }

      // $FlowFixMe
      let fn = global.parcelHotUpdate[asset.id]
      modules[asset.id] = [fn, deps]
    } else if (bundle.parent) {
      hmrApply(bundle.parent, asset)
    }
  }
}

function hmrDelete(bundle: ParcelRequire, id: string) {
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

function hmrAcceptCheck(
  bundle: ParcelRequire,
  id: string,
  depsByBundle: Record<string, Record<string, string>>
) {
  if (hmrAcceptCheckOne(bundle, id, depsByBundle)) {
    return true
  }

  // Traverse parents breadth first. All possible ancestries must accept the HMR update, or we'll reload.
  let parents = getParents(module.bundle.root, id)
  let accepted = false
  while (parents.length > 0) {
    let v = parents.shift()
    let a = hmrAcceptCheckOne(v[0], v[1], null)
    if (a) {
      // If this parent accepts, stop traversing upward, but still consider siblings.
      accepted = true
    } else {
      // Otherwise, queue the parents in the next level upward.
      let p = getParents(module.bundle.root, v[1])
      if (p.length === 0) {
        // If there are no parents, then we've reached an entry without accepting. Reload.
        accepted = false
        break
      }
      parents.push(...p)
    }
  }

  return accepted
}

function hmrAcceptCheckOne(
  bundle: ParcelRequire,
  id: string,
  depsByBundle: Record<string, Record<string, string>>
) {
  var modules = bundle.modules
  if (!modules) {
    return
  }

  if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
    // If we reached the root bundle without finding where the asset should go,
    // there's nothing to do. Mark as "accepted" so we don't reload the page.
    if (!bundle.parent) {
      return true
    }

    return hmrAcceptCheck(bundle.parent, id, depsByBundle)
  }

  if (checkedAssets[id]) {
    return true
  }

  checkedAssets[id] = true

  var cached = bundle.cache[id]

  assetsToAccept.push([bundle, id])

  if (!cached || (cached.hot && cached.hot._acceptCallbacks.length)) {
    return true
  }
}

function hmrAcceptRun(bundle: ParcelRequire, id: string) {
  var cached = bundle.cache[id]
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
    cached.hot._acceptCallbacks.forEach(function (cb) {
      const assetsToAlsoAccept = cb(function () {
        return getParents(module.bundle.root, id)
      })
      if (assetsToAlsoAccept && assetsToAccept.length) {
        // $FlowFixMe[method-unbinding]
        assetsToAccept.push.apply(assetsToAccept, assetsToAlsoAccept)
      }
    })
  }
  acceptedAssets[id] = true
}

function getParents(
  bundle: ParcelRequire,
  id: string
): Array<[ParcelRequire, string]> {
  var modules = bundle.modules
  if (!modules) {
    return []
  }

  var parents = []
  var k, d, dep

  for (k in modules) {
    for (d in modules[k][1]) {
      dep = modules[k][1][d]

      if (dep === id || (Array.isArray(dep) && dep[dep.length - 1] === id)) {
        parents.push([bundle, k])
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id))
  }

  return parents
}
