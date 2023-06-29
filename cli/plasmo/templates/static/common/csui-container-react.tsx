import React from "react"

import type { PlasmoCSUIContainerProps } from "~type"

export const OverlayCSUIContainer = (props: PlasmoCSUIContainerProps) => {
  const [top, setTop] = React.useState(0)
  const [left, setLeft] = React.useState(0)

  React.useEffect(() => {
    // Handle overlay repositioning
    if (props.anchor.type !== "overlay") {
      return
    }

    const updatePosition = async () => {
      const rect = props.anchor.element?.getBoundingClientRect()
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
    window.addEventListener("resize", updatePosition)

    return () => {
      if (typeof unwatch === "function") {
        unwatch()
      }
      window.removeEventListener("scroll", updatePosition)
      window.removeEventListener("resize", updatePosition)
    }
  }, [props.anchor.element])

  return (
    <div
      id={props.id}
      className="plasmo-csui-container"
      style={{
        display: "flex",
        position: "absolute",
        top,
        left
      }}>
      {props.children}
    </div>
  )
}

export const InlineCSUIContainer = (props: PlasmoCSUIContainerProps) => (
  <div
    id="plasmo-inline"
    className="plasmo-csui-container"
    style={{
      display: "flex",
      position: "relative",
      top: 0,
      left: 0
    }}>
    {props.children}
  </div>
)
