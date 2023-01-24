// @ts-nocheck
import * as Component from "__plasmo_import_module__"
import React from "react"
import * as ReactDOM from "react-dom"

let __plasmoRoot: HTMLElement = null

document.addEventListener("DOMContentLoaded", () => {
  if (!!__plasmoRoot) {
    return
  }

  __plasmoRoot = document.getElementById("__plasmo")
  ReactDOM.render(<Component.default />, __plasmoRoot)
})
