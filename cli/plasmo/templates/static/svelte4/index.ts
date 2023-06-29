// @ts-nocheck
import * as Component from "__plasmo_import_module__"

let __plasmoRoot: HTMLElement = null

document.addEventListener("DOMContentLoaded", () => {
  if (!!__plasmoRoot) {
    return
  }

  __plasmoRoot = document.getElementById("__plasmo")
  new Component.default({
    target: __plasmoRoot
  })
})
