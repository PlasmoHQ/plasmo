export const keepAlive = () => {
  const extRuntime = (globalThis.browser.runtime ||
    globalThis.chrome.runtime) as chrome.runtime
  const _keepAlive = () => setInterval(extRuntime.getPlatformInfo, 20e3)
  extRuntime.onStartup.addListener(_keepAlive)
  _keepAlive()
}
