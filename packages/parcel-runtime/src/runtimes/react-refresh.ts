import refreshRuntime from "react-refresh/runtime"

export async function injectReactRefresh() {
  refreshRuntime.injectIntoGlobalHook(window)

  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
}
