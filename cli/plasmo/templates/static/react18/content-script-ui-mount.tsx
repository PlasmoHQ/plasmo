import {
  createAnchorObserver,
  createShadowContainer
} from "@plasmo-static-common/csui"
import { CSUIContainer } from "@plasmo-static-common/csui-container-react"
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
          CSUIContainer
        })
    : async (anchor: PlasmoCSUIAnchor) => {
        const rootContainer = await createRootContainer(anchor)
        const root = createRoot(rootContainer)

        root.render(
          <CSUIContainer anchor={anchor}>
            <RawMount.default anchor={anchor} />
          </CSUIContainer>
        )
      }

if (!!observer) {
  observer.start(render)
} else {
  render({
    element: document.body,
    type: "overlay"
  })
}
