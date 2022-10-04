// @ts-ignore
import { createApp } from "vue"

// prettier-sort-ignore
// @ts-ignore
import RawMount from "__plasmo_mount_content_script__"

import type { PlasmoCSUI, PlasmoCSUIMountState } from "../../../src/type"

// Escape parcel's static analyzer
const Mount = RawMount.plasmo as PlasmoCSUI

const mountState: PlasmoCSUIMountState = {
  document: document || window.document,
  observer: null,
  shadowHost: null,
  // cached anchors:
  inlineAnchor: null
}

const isMounted = (el: Element | null) =>
  el?.id
    ? !!document.getElementById(el.id)
    : el?.getRootNode({ composed: true }) === mountState.document

const createMountContainer = () => {
  const container = document.createElement("div")
  container.id = "plasmo-mount-container"

  container.style.cssText = `
    display: flex;
    position: relative;
    top: 0px;
    left: 0px;
  `

  if (typeof Mount.getOverlayAnchor === "function") {
    const updatePosition = async () => {
      const anchor = await Mount.getOverlayAnchor()

      const rect = anchor?.getBoundingClientRect()

      if (!rect) {
        return
      }

      const pos = {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY
      }

      container.style.top = `${pos.top}px`
      container.style.left = `${pos.left}px`
    }

    if (typeof Mount.watchOverlayAnchor === "function") {
      Mount.watchOverlayAnchor(updatePosition)
    }
    updatePosition()
    window.addEventListener("scroll", updatePosition)
  }
  return container
}

async function createShadowContainer() {
  const container = document.createElement("div")

  container.id = "plasmo-shadow-container"

  const isInline = !!mountState.inlineAnchor

  container.style.cssText = `
    z-index: 2147483647;
    position: ${isInline ? "relative" : "absolute"};
  `

  const shadowHost = document.createElement("div")

  if (typeof Mount.getShadowHostId === "function") {
    shadowHost.id = await Mount.getShadowHostId()
  }

  const shadowRoot =
    typeof Mount.createShadowRoot === "function"
      ? await Mount.createShadowRoot(shadowHost)
      : shadowHost.attachShadow({ mode: "open" })

  mountState.shadowHost = shadowHost

  if (typeof Mount.mountShadowHost === "function") {
    await Mount.mountShadowHost(mountState)
  } else if (isInline) {
    mountState.inlineAnchor?.insertAdjacentElement("afterend", shadowHost)
  } else {
    document.body.insertAdjacentElement("beforebegin", shadowHost)
  }

  if (typeof Mount.getStyle === "function") {
    shadowRoot.appendChild(await Mount.getStyle())
  }

  shadowRoot.appendChild(container)
  return container
}

const createRootContainer =
  typeof Mount.getRootContainer === "function"
    ? Mount.getRootContainer
    : createShadowContainer

const render = async () => {
  const rootContainer = await createRootContainer()
  const mountPoint = createMountContainer()
  rootContainer.appendChild(mountPoint)

  const app = createApp(RawMount)
  app.mount(mountPoint)
}

const startObserver = () => {
  mountState.observer = new MutationObserver(() => {
    if (isMounted(mountState.shadowHost)) {
      return
    }
    const inlineAnchor = Mount.getInlineAnchor()
    if (!inlineAnchor) {
      return
    }

    mountState.inlineAnchor = inlineAnchor
    render()
  })

  mountState.observer.observe(document.body, {
    childList: true,
    subtree: true
  })
}

if (typeof Mount.render === "function") {
  Mount.render(createRootContainer, createMountContainer)
} else if (typeof Mount.getInlineAnchor === "function") {
  startObserver()
} else {
  render()
}
