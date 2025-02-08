import React from "react"
import { createRoot } from "react-dom/client"

import { getLayout } from "@plasmo-static-common/react"

// @ts-ignore
import * as Component from "__plasmo_import_module__"

let __plasmoRoot: HTMLElement = null

document.addEventListener("DOMContentLoaded", () => {
  if (!!__plasmoRoot) {
    return
  }

  __plasmoRoot = document.getElementById("__plasmo")

  const root = createRoot(__plasmoRoot)

  const Layout = getLayout(Component)

  root.render(
    <Layout>
      <Component.default />
    </Layout>
  )
})
