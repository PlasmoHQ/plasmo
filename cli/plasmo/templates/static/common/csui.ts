import type { PlasmoCSUI, PlasmoCSUIAnchor, PlasmoCSUIMountState } from "~type"

async function createShadowRoot(
  anchor: PlasmoCSUIAnchor,
  Mount: PlasmoCSUI,
  mountState?: PlasmoCSUIMountState
) {
  const shadowHost = document.createElement("div")

  mountState?.hostSet.add(shadowHost)
  mountState?.hostMap.set(shadowHost, anchor)

  if (typeof Mount.getShadowHostId === "function") {
    shadowHost.id = await Mount.getShadowHostId(anchor)
  }

  const shadowRoot =
    typeof Mount.createShadowRoot === "function"
      ? await Mount.createShadowRoot(shadowHost)
      : shadowHost.attachShadow({ mode: "open" })

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

  if (typeof Mount.getStyle === "function") {
    shadowRoot.appendChild(await Mount.getStyle(anchor))
  }

  return shadowRoot
}

export async function createShadowContainer(
  anchor: PlasmoCSUIAnchor,
  Mount: PlasmoCSUI,
  mountState?: PlasmoCSUIMountState
) {
  const shadowRoot = await createShadowRoot(anchor, Mount, mountState)

  const container = document.createElement("div")
  container.id = "plasmo-shadow-container"
  container.style.cssText = `
    z-index: 2147483647;
    position: ${anchor.type === "inline" ? "relative" : "absolute"};
  `

  shadowRoot.appendChild(container)
  return container
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

    if (hasInlineAnchor) {
      const inlineAnchor = await Mount.getInlineAnchor()
      if (inlineAnchor && !mountedInlineAnchorSet.has(inlineAnchor)) {
        render({
          type: "inline",
          element: inlineAnchor
        })
      }
    }

    if (hasInlineAnchorList) {
      const inlineAnchorList = await Mount.getInlineAnchorList()

      if (inlineAnchorList!.length > 0) {
        inlineAnchorList!.forEach((inlineAnchor) => {
          if (
            inlineAnchor instanceof HTMLElement &&
            !mountedInlineAnchorSet.has(inlineAnchor)
          ) {
            render({
              element: inlineAnchor,
              type: "inline"
            })
          }
        })
      }
    }

    if (hasOverlayAnchor) {
      const overlayAnchor = await Mount.getOverlayAnchor()
      if (overlayAnchor && !mountedOverlayAnchorSet.has(overlayAnchor)) {
        render({
          element: overlayAnchor,
          type: "overlay"
        })
      }
    }

    if (hasOverlayAnchorList) {
      const overlayAnchorList = await Mount.getOverlayAnchorList()

      if (overlayAnchorList!.length > 0) {
        overlayAnchorList!.forEach((overlayAnchor) => {
          if (
            overlayAnchor instanceof HTMLElement &&
            !mountedOverlayAnchorSet.has(overlayAnchor)
          ) {
            render({
              element: overlayAnchor,
              type: "overlay"
            })
          }
        })
      }
    }

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
