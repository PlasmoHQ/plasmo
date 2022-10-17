import { createAnchorObserver, createRender } from "@plasmo-static-common/csui"
import {
  createInlineCSUIContainer,
  createOverlayCSUIContainer
} from "@plasmo-static-common/csui-container-vanilla"

// prettier-sort-ignore
// @ts-ignore
import * as RawMount from "__plasmo_mount_content_script__"

import type { PlasmoCSUI, PlasmoCSUIAnchor } from "~type"

// Escape parcel's static analyzer
const Mount = RawMount as PlasmoCSUI

const observer = createAnchorObserver(Mount)

const render = createRender(
  Mount,
  [createInlineCSUIContainer, createOverlayCSUIContainer],
  observer?.mountState,
  async (anchor, rootContainer) => {
    switch (anchor.type) {
      case "inline": {
        const mountPoint = createInlineCSUIContainer({ anchor })
        rootContainer.appendChild(mountPoint)
        new Mount.default({
          target: mountPoint,
          props: {
            anchor
          }
        })
        break
      }
      case "overlay": {
        const targetList = observer?.mountState.overlayTargetList || [
          anchor.element
        ]

        targetList.forEach((target, i) => {
          const id = `plasmo-overlay-${i}`
          const innerAnchor: PlasmoCSUIAnchor = {
            element: target,
            type: "overlay"
          }

          const mountPoint = createOverlayCSUIContainer({
            id,
            anchor: innerAnchor,
            watchOverlayAnchor: Mount.watchOverlayAnchor
          })

          rootContainer.appendChild(mountPoint)
          new Mount.default({
            target: mountPoint,
            props: {
              anchor: innerAnchor
            }
          })
        })
        break
      }
    }
  }
)

if (!!observer) {
  observer.start(render)
} else {
  render({
    element: document.body,
    type: "overlay"
  })
}
