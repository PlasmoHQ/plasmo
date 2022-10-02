import React from "react"

// prettier-sort-ignore
// @ts-ignore
import * as RawMount from "__plasmo_mount_content_script__"

import * as ReactDOM from "react-dom"

import type { PlasmoCSUI, PlasmoCSUIMountState } from "../../../src/type"

// Escape parcel's static analyzer
const Mount = RawMount as PlasmoCSUI

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

const MountContainer = () => {
  const [top, setTop] = React.useState(0)
  const [left, setLeft] = React.useState(0)

  React.useEffect(() => {
    if (typeof Mount.getOverlayAnchor !== "function") {
      return
    }
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

      setLeft(pos.left)
      setTop(pos.top)
    }

    updatePosition()

    if (typeof Mount.watchOverlayAnchor === "function") {
      Mount.watchOverlayAnchor(updatePosition)
    }

    window.addEventListener("scroll", updatePosition)

    return () => window.removeEventListener("scroll", updatePosition)
  }, [])

  return (
    <div
      id="plasmo-mount-container"
      style={{
        display: "flex",
        position: "relative",
        top,
        left
      }}>
      <RawMount.default />
    </div>
  )
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
  ReactDOM.render(<MountContainer />, rootContainer)
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
  Mount.render(createRootContainer, MountContainer)
} else if (typeof Mount.getInlineAnchor === "function") {
  startObserver()
} else {
  render()
}
