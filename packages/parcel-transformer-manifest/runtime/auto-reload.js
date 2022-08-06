const extContext = typeof chrome === "undefined" ? browser : chrome
addEventListener("beforeunload", function () {
  try {
    extContext.runtime.sendMessage({
      __parcel_hmr_reload__: true
    })
  } catch {}
})
