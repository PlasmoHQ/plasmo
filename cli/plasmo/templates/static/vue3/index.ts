// @ts-nocheck
import { createApp } from "vue"

import * as Component from "__plasmo_import_module__"

document.addEventListener("DOMContentLoaded", () => {
  const app = createApp(Component.default)
  Component.default.prepare?.(app)
  app.mount("#__plasmo")
})
