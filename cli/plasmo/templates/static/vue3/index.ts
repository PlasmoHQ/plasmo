// @ts-nocheck
import { createApp } from "vue"

import * as Component from "__plasmo_import_module__"

__VUE_OPTIONS_API__ = true
if(process.env.NODE_ENV !== 'production') {
  __VUE_PROD_DEVTOOLS__ = true
} else {
  __VUE_PROD_DEVTOOLS__ = false
}

document.addEventListener("DOMContentLoaded", () => {
  const app = createApp(Component.default)
  Component.default.prepare?.(app)
  app.mount("#__plasmo")
})
