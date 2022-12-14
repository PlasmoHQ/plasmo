import type { ParcelBundle } from "../types"

export const hmrState = {
  checkedAssets: {} as Record<string, boolean>,
  acceptedAssets: {} as Record<string, boolean>,
  assetsToAccept: [] as Array<[ParcelBundle, string]>
}

export const resetHmrState = () => {
  hmrState.checkedAssets = {}
  hmrState.acceptedAssets = {}
  hmrState.assetsToAccept = []
}

export function getParents(
  bundle: ParcelBundle,
  id: string
): Array<[ParcelBundle, string]> {
  const { modules } = bundle
  if (!modules) {
    return []
  }

  let parents = []

  for (const modId in modules) {
    for (const depId in modules[modId][1]) {
      const dep = modules[modId][1][depId]

      if (dep === id || (Array.isArray(dep) && dep[dep.length - 1] === id)) {
        parents.push([bundle, modId])
      }
    }
  }

  if (bundle.parent) {
    parents = parents.concat(getParents(bundle.parent, id))
  }

  return parents
}

export function hmrAcceptCheck(
  bundle: ParcelBundle,
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
    const [parentAsset, parentId] = parents.shift()
    const canHmr = hmrAcceptCheckOne(parentAsset, parentId, null)
    if (canHmr) {
      // If this parent accepts, stop traversing upward, but still consider siblings.
      accepted = true
    } else {
      // Otherwise, queue the parents in the next level upward.
      const p = getParents(module.bundle.root, parentId)
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
  bundle: ParcelBundle,
  id: string,
  depsByBundle: Record<string, Record<string, string>>
) {
  const { modules } = bundle
  if (!modules) {
    return false
  }

  if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
    // If we reached the root bundle without finding where the asset should go,
    // there's nothing to do. Mark as "accepted" so we don't reload the page.
    if (!bundle.parent) {
      return true
    }

    return hmrAcceptCheck(bundle.parent, id, depsByBundle)
  }

  if (hmrState.checkedAssets[id]) {
    return true
  }

  hmrState.checkedAssets[id] = true

  var cached = bundle.cache[id]

  hmrState.assetsToAccept.push([bundle, id])

  return !cached || (cached.hot && cached.hot._acceptCallbacks.length)
}

export function isDependencyOfBundle(bundle: ParcelBundle, id: string) {
  const { modules } = bundle
  if (!modules) {
    return false
  }

  return !!modules[id]
}
