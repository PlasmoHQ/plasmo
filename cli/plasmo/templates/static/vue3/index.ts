// @ts-nocheck
import * as Component from "__plasmo_import_module__"
import { createApp } from "vue"

document.addEventListener("DOMContentLoaded", () => {
  const app = createApp(Component.default)
  Component.default.prepare?.(app)
  app.mount("#__plasmo")
})
