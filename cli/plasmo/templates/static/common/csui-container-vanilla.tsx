import type { PlasmoCSUIContainerProps } from "~type"

export const createOverlayCSUIContainer = (props: PlasmoCSUIContainerProps) => {
  const container = document.createElement("div")
  container.className = "plasmo-csui-container"
  container.id = props.id

  container.style.cssText = `
    display: flex;
    position: relative;
    top: 0px;
    left: 0px;
  `

  if (props.anchor.type === "overlay") {
    const updatePosition = async () => {
      const rect = props.anchor.element.getBoundingClientRect()

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

    updatePosition()

    props.watchOverlayAnchor?.(updatePosition)
    window.addEventListener("scroll", updatePosition)
    window.addEventListener("resize", updatePosition)
  }

  return container
}

export const createInlineCSUIContainer = (props: PlasmoCSUIContainerProps) => {
  const container = document.createElement("div")
  container.className = "plasmo-csui-container"
  container.id = "plasmo-inline"

  container.style.cssText = `
    display: flex;
    position: relative;
    top: 0px;
    left: 0px;
  `

  return container
}
