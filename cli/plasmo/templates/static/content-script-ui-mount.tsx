// @ts-nocheck
import * as Mount from "__plasmo_mount_content_script__"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"

const MountContainer = () => {
  const [top, setTop] = useState(0)
  const [left, setLeft] = useState(0)

  useEffect(() => {
    const updatePosition = async () => {
      if (typeof Mount.getMountPoint !== "function") {
        return
      }

      const pricingSection = (await Mount.getMountPoint()) as HTMLElement

      const rect = pricingSection?.getBoundingClientRect()

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

window.addEventListener("load", () => {
  const mountPoint = document.createElement("div")

  mountPoint.style.cssText = `
    z-index: 1;
    position: absolute;
  `

  const shadowHost = document.createElement("div")

  const shadowRoot = shadowHost.attachShadow({ mode: "open" })
  document.body.insertAdjacentElement("beforebegin", shadowHost)

  shadowRoot.appendChild(mountPoint)
  const root = createRoot(mountPoint)

  root.render(<MountContainer />)
})
