import { createAnchorObserver, createRender } from "@plasmo-static-common/csui"
import {
  createInlineCSUIContainer,
  createOverlayCSUIContainer
} from "@plasmo-static-common/csui-container-vanilla"
// @ts-ignore
import { createApp } from "vue"

// prettier-sort-ignore
// @ts-ignore
import RawMount from "__plasmo_mount_content_script__"

// prettier-sort-ignore
// @ts-ignore
import SfcStyleContent from "style-raw:__plasmo_mount_content_script__"

import type {
  PlasmoCSUI,
  PlasmoCSUIAnchor,
  PlasmoCSUIHTMLContainer
} from "~type"

// Escape parcel's static analyzer
const Mount = (RawMount.plasmo || {}) as PlasmoCSUI<PlasmoCSUIHTMLContainer>

if (typeof SfcStyleContent === "string") {
  Mount.getSfcStyleContent = () => SfcStyleContent

  if (typeof Mount.getStyle !== "function") {
    Mount.getStyle = ({ sfcStyleContent }) => {
      const element = document.createElement("style")
      element.textContent = sfcStyleContent
      return element
    }
  }
}

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

        const app = createApp(RawMount)
        app.mount(mountPoint, {
          anchor
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

          const app = createApp(RawMount)
          app.mount(mountPoint, {
            anchor: innerAnchor
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
    element: document.documentElement,
    type: "overlay"
  })
}

if (typeof Mount.watch === "function") {
  Mount.watch({
    observer,
    render
  })
}
