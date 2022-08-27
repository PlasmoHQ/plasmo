// @ts-nocheck
// prettier-sort-ignore
import React from "react"

import * as RawMount from "__plasmo_mount_content_script__"
import { createRoot } from "react-dom/client"

// Escape parcel's static analyzer
const Mount = RawMount

const MountContainer = () => {
  const [top, setTop] = React.useState(0)
  const [left, setLeft] = React.useState(0)

  React.useEffect(() => {
    if (typeof Mount.getMountPoint !== "function") {
      return
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

      setLeft(pos.left)
      setTop(pos.top)
    }

    updatePosition()

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

window.addEventListener("load", async () => {
  const rootContainer =
    typeof Mount.getRootContainer === "function"
      ? await Mount.getRootContainer()
      : await createShadowContainer()

  const root = createRoot(rootContainer)

  root.render(<MountContainer />)
})
