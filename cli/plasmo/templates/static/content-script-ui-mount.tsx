// @ts-nocheck
import * as Mount from "__plasmo_mount_content_script__"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

const AnchorContainer = () => {
  const [top, setTop] = useState(0)
  const [left, setLeft] = useState(0)

  useEffect(() => {
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
      style={{
        display: "flex",
        position: "relative",
        top,
        left
      }}>
      <Mount.default />
    </div>
  )
}

const MountContainer =
  typeof Mount.getMountPoint === "function" ? AnchorContainer : Mount.default

function createShadowContainer() {
  const container = document.createElement("div")

  container.style.cssText = `
    z-index: 1;
    position: absolute;
  `

  const shadowHost = document.createElement("div")

  const shadowRoot = shadowHost.attachShadow({ mode: "open" })
  document.body.insertAdjacentElement("beforebegin", shadowHost)

  shadowRoot.appendChild(container)

  return container
}

window.addEventListener("load", () => {
  const rootContainer =
    typeof Mount.getRootContainer === "function"
      ? Mount.getRootContainer()
      : createShadowContainer()

  const root = createRoot(rootContainer)

  root.render(<MountContainer />)
})
