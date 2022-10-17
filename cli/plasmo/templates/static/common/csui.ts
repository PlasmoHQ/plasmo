import type { PlasmoCSUI, PlasmoCSUIAnchor, PlasmoCSUIMountState } from "~type"

async function createShadowDOM(
  Mount: PlasmoCSUI,
  mountState?: PlasmoCSUIMountState
) {
  const shadowHost = document.createElement("div")

  mountState?.hostSet.add(shadowHost)

  const shadowRoot =
    typeof Mount.createShadowRoot === "function"
      ? await Mount.createShadowRoot(shadowHost)
      : shadowHost.attachShadow({ mode: "open" })

  const shadowContainer = document.createElement("div")

  shadowContainer.id = "plasmo-shadow-container"
  shadowContainer.style.zIndex = "2147483647"

  shadowRoot.appendChild(shadowContainer)

  return {
    shadowContainer,
    shadowRoot,
    shadowHost
  }
}

export type PlasmoCSUIShadowDOM = Awaited<ReturnType<typeof createShadowDOM>>

async function injectAnchor(
  { shadowContainer, shadowHost, shadowRoot }: PlasmoCSUIShadowDOM,
  anchor: PlasmoCSUIAnchor,
  Mount: PlasmoCSUI,
  mountState?: PlasmoCSUIMountState
) {
  shadowContainer.style.position =
    anchor.type === "inline" ? "relative" : "absolute"

  if (typeof Mount.getStyle === "function") {
    shadowRoot.prepend(await Mount.getStyle(anchor))
  }

  mountState?.hostMap.set(shadowHost, anchor)

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
  const shadowDOM = await createShadowDOM(Mount, mountState)

  await injectAnchor(shadowDOM, anchor, Mount, mountState)

  return shadowDOM.shadowContainer
}

export function createAnchorObserver(Mount: PlasmoCSUI) {
  const mountState: PlasmoCSUIMountState = {
    document: document || window.document,
    observer: null,

    isMounting: false,
    isMutated: false,

    hostSet: new Set(),
    hostMap: new WeakMap()
  }

  const isMounted = (el: Element | null) =>
    el?.id
      ? !!document.getElementById(el.id)
      : el?.getRootNode({ composed: true }) === mountState.document

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
    const mountedOverlayAnchorSet = new WeakSet()

    // Go through mounted sets and check if they are still mounted
    for (const el of mountState.hostSet) {
      if (isMounted(el)) {
        const anchor = mountState.hostMap.get(el)
        if (!!anchor) {
          if (anchor.type === "inline") {
            mountedInlineAnchorSet.add(anchor.element)
          } else if (anchor.type === "overlay") {
            mountedOverlayAnchorSet.add(anchor.element)
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

    if (!!overlayAnchor && !mountedOverlayAnchorSet.has(overlayAnchor)) {
      renderList.push({
        element: overlayAnchor,
        type: "overlay"
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

    if ((overlayAnchorList?.length || 0) > 0) {
      overlayAnchorList.forEach((overlayAnchor) => {
        if (
          overlayAnchor instanceof Element &&
          !mountedOverlayAnchorSet.has(overlayAnchor)
        ) {
          renderList.push({
            element: overlayAnchor,
            type: "overlay"
          })
        }
      })
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
