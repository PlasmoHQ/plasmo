import type { PlasmoCSUI, PlasmoCSUIAnchor, PlasmoCSUIMountState } from "~type"

async function createShadowDOM(Mount: PlasmoCSUI) {
  const shadowHost = document.createElement("plasmo-csui")

  const shadowRoot =
    typeof Mount.createShadowRoot === "function"
      ? await Mount.createShadowRoot(shadowHost)
      : shadowHost.attachShadow({ mode: "open" })

  const shadowContainer = document.createElement("div")

  shadowContainer.id = "plasmo-shadow-container"
  shadowContainer.style.zIndex = "2147483647"
  shadowContainer.style.position = "relative"

  shadowRoot.appendChild(shadowContainer)

  return {
    shadowHost,
    shadowRoot,
    shadowContainer
  }
}

export type PlasmoCSUIShadowDOM = Awaited<ReturnType<typeof createShadowDOM>>

async function injectAnchor(
  { shadowHost, shadowRoot }: PlasmoCSUIShadowDOM,
  anchor: PlasmoCSUIAnchor,
  Mount: PlasmoCSUI,
  mountState?: PlasmoCSUIMountState
) {
  if (typeof Mount.getStyle === "function") {
    shadowRoot.prepend(await Mount.getStyle(anchor))
  }

  if (typeof Mount.getShadowHostId === "function") {
    shadowHost.id = await Mount.getShadowHostId(anchor)
  }

  if (typeof Mount.mountShadowHost === "function") {
    await Mount.mountShadowHost({
      shadowHost,
      anchor,
      observer: mountState?.observer
    })
  } else if (anchor.type === "inline") {
    anchor.element.insertAdjacentElement("afterend", shadowHost)
  } else {
    document.body.insertAdjacentElement("beforebegin", shadowHost)
  }
}

export async function createShadowContainer(
  anchor: PlasmoCSUIAnchor,
  Mount: PlasmoCSUI,
  mountState?: PlasmoCSUIMountState
) {
  const shadowDom = await createShadowDOM(Mount)

  mountState?.hostSet.add(shadowDom.shadowHost)
  mountState?.hostMap.set(shadowDom.shadowHost, anchor)

  await injectAnchor(shadowDom, anchor, Mount, mountState)

  return shadowDom.shadowContainer
}

export function createAnchorObserver(Mount: PlasmoCSUI) {
  const mountState: PlasmoCSUIMountState = {
    document: document || window.document,
    observer: null,

    isMounting: false,
    isMutated: false,

    hostSet: new Set(),
    hostMap: new WeakMap(),

    overlayTargetList: []
  }

  const isMounted = (el: Element | null) =>
    el?.id
      ? !!document.getElementById(el.id)
      : el?.getRootNode({ composed: true }) === mountState.document

  const isVisible = (el: Element) => {
    const elementRect = el.getBoundingClientRect()
    const elementStyle = getComputedStyle(el)

    if (elementStyle.display === "none") {
      return false
    }

    if (elementStyle.visibility === "hidden") {
      return false
    }

    if (elementStyle.opacity === "0") {
      return false
    }

    if (
      elementRect.width === 0 &&
      elementRect.height === 0 &&
      elementStyle.overflow !== "hidden"
    ) {
      return false
    }

    // Check if the element is irrevocably off-screen:
    if (
      elementRect.x + elementRect.width < 0 ||
      elementRect.y + elementRect.height < 0
    ) {
      return false
    }

    return true
  }

  const hasInlineAnchor = typeof Mount.getInlineAnchor === "function"
  const hasOverlayAnchor = typeof Mount.getOverlayAnchor === "function"

  const hasInlineAnchorList = typeof Mount.getInlineAnchorList === "function"
  const hasOverlayAnchorList = typeof Mount.getOverlayAnchorList === "function"

  const shouldObserve =
    hasInlineAnchor ||
    hasOverlayAnchor ||
    hasInlineAnchorList ||
    hasOverlayAnchorList

  if (!shouldObserve) {
    return null
  }

  async function mountAnchors(render: (anchor?: PlasmoCSUIAnchor) => void) {
    mountState.isMounting = true

    const mountedInlineAnchorSet = new WeakSet()

    // There should only be 1 overlay mount
    let overlayHost: Element = null

    // Go through mounted sets and check if they are still mounted
    for (const el of mountState.hostSet) {
      if (isMounted(el)) {
        const anchor = mountState.hostMap.get(el)
        if (!!anchor) {
          if (anchor.type === "inline") {
            mountedInlineAnchorSet.add(anchor.element)
          } else if (anchor.type === "overlay") {
            overlayHost = el
          }
        }
      } else {
        mountState.hostSet.delete(el)
      }
    }

    const [inlineAnchor, inlineAnchorList, overlayAnchor, overlayAnchorList] =
      await Promise.all([
        hasInlineAnchor ? Mount.getInlineAnchor() : null,
        hasInlineAnchorList ? Mount.getInlineAnchorList() : null,
        hasOverlayAnchor ? Mount.getOverlayAnchor() : null,
        hasOverlayAnchorList ? Mount.getOverlayAnchorList() : null
      ])

    const renderList: PlasmoCSUIAnchor[] = []

    if (!!inlineAnchor && !mountedInlineAnchorSet.has(inlineAnchor)) {
      renderList.push({
        element: inlineAnchor,
        type: "inline"
      })
    }

    if ((inlineAnchorList?.length || 0) > 0) {
      inlineAnchorList.forEach((inlineAnchor) => {
        if (
          inlineAnchor instanceof Element &&
          !mountedInlineAnchorSet.has(inlineAnchor)
        ) {
          renderList.push({
            element: inlineAnchor,
            type: "inline"
          })
        }
      })
    }

    const overlayTargetList = []

    if (!!overlayAnchor && isVisible(overlayAnchor)) {
      overlayTargetList.push(overlayAnchor)
    }

    if ((overlayAnchorList?.length || 0) > 0) {
      overlayAnchorList.forEach((el) => {
        if (el instanceof Element && isVisible(el)) {
          overlayTargetList.push(el)
        }
      })
    }

    if (overlayTargetList.length > 0) {
      mountState.overlayTargetList = overlayTargetList
      if (!overlayHost) {
        renderList.push({
          element: document.body,
          type: "overlay"
        })
      } else {
        // force re-render
      }
    } else {
      overlayHost?.remove()
      mountState.hostSet.delete(overlayHost)
    }

    await Promise.all(renderList.map(render))

    if (mountState.isMutated) {
      mountState.isMutated = false
      await mountAnchors(render)
    }

    mountState.isMounting = false
  }

  const start = (render: (anchor?: PlasmoCSUIAnchor) => void) => {
    mountState.observer = new MutationObserver(() => {
      if (mountState.isMounting) {
        mountState.isMutated = true
        return
      }
      mountAnchors(render)
    })

    // Need to watch the subtree for shadowDOM
    mountState.observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  return {
    start,
    mountState
  }
}
