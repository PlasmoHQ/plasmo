// prettier-sort-ignore
// @ts-ignore
import * as RawMount from "__plasmo_mount_content_script__"

import type { PlasmoCSUI } from "../../../src/type"

// Escape parcel's static analyzer
const Mount = RawMount as PlasmoCSUI

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

  container.style.cssText = `
    z-index: 2147483647;
    position: absolute;
  `

  const shadowHost = document.createElement("div")

  if (typeof Mount.getShadowHostId === "function") {
    shadowHost.id = await Mount.getShadowHostId()
  }

  const shadowRoot = shadowHost.attachShadow({ mode: "open" })
  document.body.insertAdjacentElement("beforebegin", shadowHost)

  if (typeof Mount.getStyle === "function") {
    shadowRoot.appendChild(await Mount.getStyle())
  }

  shadowRoot.appendChild(container)
  return container
}

new MutationObserver(async (_, observer) => {
  const rootContainer =
    typeof Mount.getRootContainer === "function"
      ? await Mount.getRootContainer()
      : await createShadowContainer()

  if (!rootContainer) {
    return
  }

  observer.disconnect()

  const mountPoint = createMountContainer()
  rootContainer.appendChild(mountPoint)

  new Mount.default({
    target: mountPoint
  })
}).observe(document, { childList: true, subtree: true })
