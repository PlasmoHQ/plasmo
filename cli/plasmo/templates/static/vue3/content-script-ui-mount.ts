// @ts-nocheck
// prettier-sort-ignore
import { createApp } from "vue"

import * as RawMount from "__plasmo_mount_content_script__"

// Escape parcel's static analyzer
const Mount = RawMount

const createMountContainer = () => {
  const container = document.createElement("div")
  container.id = "plasmo-mount-container"

  container.style.cssText = `
    display: flex;
    position: relative;
    top: 0px;
    left: 0px;
  `

  if (typeof Mount.getMountPoint !== "function") {
    return container
  }

  const updatePosition = async () => {
    const anchor = (await Mount.getMountPoint()) as HTMLElement

    const rect = anchor?.getBoundingClientRect()

    if (!rect) {
      console.error("getMountPoint is not returning a valid HTMLElement")
      return
    }

    const pos = {
      left: rect.left + window.scrollX,
      top: rect.top + window.scrollY
    }

    container.style.top = `${pos.top}px`
    container.style.left = `${pos.left}px`
  }

  updatePosition()
  window.addEventListener("scroll", updatePosition)
}

async function createShadowContainer() {
  const container = document.createElement("div")

  container.id = "plasmo-shadow-container"

  container.style.cssText = `
    z-index: 1;
    position: absolute;
  `

  const shadowHost = document.createElement("div")

  if (typeof Mount.getShadowHostId() === "function") {
    const SHADOW_HOST_ID =  await Mount.getShadowHostId();
    // as per HTML5, element ids must not be empty & must not contain spaces
    if (SHADOW_HOST_ID.length > 0 && SHADOW_HOST_ID.indexOf(' ') >= 0) {
      shadowHost.id = SHADOW_HOST_ID
    }
  }

  const shadowRoot = shadowHost.attachShadow({ mode: "open" })
  document.body.insertAdjacentElement("beforebegin", shadowHost)

  if (typeof Mount.getStyle === "function") {
    shadowRoot.appendChild(await Mount.getStyle())
  }

  shadowRoot.appendChild(container)
  return container
}

window.addEventListener("load", async () => {
  const rootContainer =
    typeof Mount.getRootContainer === "function"
      ? await Mount.getRootContainer()
      : await createShadowContainer()

  const mountPoint = createMountContainer()
  rootContainer.appendChild(mountPoint)

  const app = createApp(Mount.default)
  app.mount(mountPoint)
})
