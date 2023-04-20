// @ts-nocheck
import * as Component from "__plasmo_import_module__"
import React from "react"
import * as ReactDOM from "react-dom"

let __plasmoRoot: HTMLElement = null

document.addEventListener("DOMContentLoaded", () => {
  if (!!__plasmoRoot) {
    return
  }

  const Layout =
    Component.Layout || Component.getGlobalProvider?.() || React.Fragment

  __plasmoRoot = document.getElementById("__plasmo")

  ReactDOM.render(
    <Layout>
      <Component.default />
    </Layout>,
    __plasmoRoot
  )
})
