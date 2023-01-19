import refreshRuntime from "react-refresh/runtime"

export async function injectReactRefresh() {
  refreshRuntime.injectIntoGlobalHook(window)

  window.$RefreshReg$ = function () {}
  window.$RefreshSig$ = function () {
    return function (type) {
      return type
    }
  }
}
