import {
  createAnchorObserver,
  createShadowContainer
} from "@plasmo-static-common/csui"
import {
  InlineCSUIContainer,
  OverlayCSUIContainer
} from "@plasmo-static-common/csui-container-react"
import React from "react"
import { createRoot } from "react-dom/client"

// prettier-sort-ignore
// @ts-ignore
import * as RawMount from "__plasmo_mount_content_script__"

import type { PlasmoCSUI, PlasmoCSUIAnchor } from "~type"

// Escape parcel's static analyzer
const Mount = RawMount as PlasmoCSUI

const observer = createAnchorObserver(Mount)

const createRootContainer = (anchor: PlasmoCSUIAnchor) =>
  typeof Mount.getRootContainer === "function"
    ? Mount.getRootContainer({
        anchor,
        mountState: observer?.mountState
      })
    : createShadowContainer(anchor, Mount, observer?.mountState)

const render =
  typeof Mount.render === "function"
    ? (anchor: PlasmoCSUIAnchor) =>
        Mount.render({
          anchor,
          createRootContainer,
          CSUIContainer: OverlayCSUIContainer
        })
    : async (anchor: PlasmoCSUIAnchor) => {
        const rootContainer = await createRootContainer(anchor)
        const root = createRoot(rootContainer)

        if (anchor.type === "overlay") {
          root.render(
            <>
              {observer.mountState.overlayTargetList.map((target, i) => {
                const id = `plasmo-overlay-${i}`
                const innerAnchor: PlasmoCSUIAnchor = {
                  element: target,
                  type: "overlay"
                }
                return (
                  <OverlayCSUIContainer
                    id={id}
                    key={id}
                    anchor={innerAnchor}
                    watchOverlayAnchor={Mount.watchOverlayAnchor}>
                    <RawMount.default anchor={innerAnchor} />
                  </OverlayCSUIContainer>
                )
              })}
            </>
          )
        } else {
          root.render(
            <InlineCSUIContainer anchor={anchor}>
              <RawMount.default anchor={anchor} />
            </InlineCSUIContainer>
          )
        }
      }

if (!!observer) {
  observer.start(render)
} else {
  render({
    element: document.body,
    type: "overlay"
  })
}
