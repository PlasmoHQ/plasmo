import React from "react"
import * as ReactDOM from "react-dom"

import { getLayout } from "@plasmo-static-common/react"

// @ts-ignore
import * as Component from "__plasmo_import_module__"

let __plasmoRoot: HTMLElement = null

document.addEventListener("DOMContentLoaded", () => {
  if (!!__plasmoRoot) {
    return
  }

  const Layout = getLayout(Component)

  __plasmoRoot = document.getElementById("__plasmo")

  ReactDOM.render(
    <Layout>
      <Component.default />
    </Layout>,
    __plasmoRoot
  )
})
