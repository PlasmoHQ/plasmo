import React from "react"

import type { PlasmoCSUIAnchor, PlasmoWatchOverlayAnchor } from "~type"

export const CSUIContainer = (props: {
  anchor: PlasmoCSUIAnchor
  children?: React.ReactNode
  watchOverlayAnchor?: PlasmoWatchOverlayAnchor
}) => {
  const [top, setTop] = React.useState(0)
  const [left, setLeft] = React.useState(0)

  React.useEffect(() => {
    // Handle overlay repositioning
    if (props.anchor.type !== "overlay") {
      return
    }

    const updatePosition = async () => {
      const rect = props.anchor.element.getBoundingClientRect()

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

    const unwatch = props.watchOverlayAnchor?.(updatePosition)
    window.addEventListener("scroll", updatePosition)

    return () => {
      unwatch?.()
      window.removeEventListener("scroll", updatePosition)
    }
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
      {props.children}
    </div>
  )
}
