import React from "react"
import { createRoot } from "react-dom/client"

// prettier-sort-ignore
// @ts-ignore
import * as RawMount from "__plasmo_mount_content_script__"

import {
  createAnchorObserver,
  createShadowContainer
} from "@plasmo-static-common/csui"

import type { PlasmoCSUI, PlasmoCSUIAnchor } from "~type"

// Escape parcel's static analyzer
const Mount = RawMount as PlasmoCSUI

const MountContainer = (props: any) => {
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
      return Mount.watchOverlayAnchor(updatePosition)
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
      <RawMount.default {...props} />
    </div>
  )
}

async function getRootContainer(anchor: PlasmoCSUIAnchor) {
  return createShadowContainer(anchor, Mount)
}

const createRootContainer =
  typeof Mount.getRootContainer === "function"
    ? Mount.getRootContainer
    : getRootContainer

const render =
  typeof Mount.render === "function"
    ? (anchor?: PlasmoCSUIAnchor) =>
        Mount.render(createRootContainer, MountContainer, anchor)
    : async (anchor?: PlasmoCSUIAnchor) => {
        const rootContainer = await createRootContainer(anchor)
        const root = createRoot(rootContainer)

        root.render(<MountContainer anchor={anchor} />)
      }

const observer = createAnchorObserver(Mount, render)

if (!!observer) {
  observer.start()
} else {
  render()
}
