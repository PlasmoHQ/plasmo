import React from "react"
import * as ReactDOM from "react-dom"

import { createAnchorObserver, createRender } from "@plasmo-static-common/csui"
import {
  InlineCSUIContainer,
  OverlayCSUIContainer
} from "@plasmo-static-common/csui-container-react"
import { getLayout } from "@plasmo-static-common/react"

import type {
  PlasmoCSUI,
  PlasmoCSUIAnchor,
  PlasmoCSUIJSXContainer
} from "~type"

// @ts-ignore
import * as RawMount from "__plasmo_mount_content_script__"

// Escape parcel's static analyzer
const Mount = RawMount as PlasmoCSUI<PlasmoCSUIJSXContainer>

const observer = createAnchorObserver(Mount)

const render = createRender(
  Mount,
  [InlineCSUIContainer, OverlayCSUIContainer],
  observer?.mountState,
  async (anchor, rootContainer) => {
    const Layout = getLayout(RawMount)

    switch (anchor.type) {
      case "inline": {
        ReactDOM.render(
          <Layout>
            <InlineCSUIContainer anchor={anchor}>
              <RawMount.default anchor={anchor} />
            </InlineCSUIContainer>
          </Layout>,
          rootContainer
        )
        break
      }
      case "overlay": {
        const targetList = observer?.mountState.overlayTargetList || [
          anchor.element
        ]

        ReactDOM.render(
          <Layout>
            {targetList.map((target, i) => {
              const id = `plasmo-overlay-${i}`
              const innerAnchor: PlasmoCSUIAnchor = {
                element: target,
                type: "overlay"
              }
              return (
                <OverlayCSUIContainer
                  key={id}
                  id={id}
                  anchor={innerAnchor}
                  watchOverlayAnchor={Mount.watchOverlayAnchor}>
                  <RawMount.default anchor={innerAnchor} />
                </OverlayCSUIContainer>
              )
            })}
          </Layout>,
          rootContainer
        )
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
