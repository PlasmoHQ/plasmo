export const keepAlive = () => {
  const extRuntime = (globalThis.browser.runtime ||
    globalThis.chrome.runtime) as typeof chrome.runtime
  const _keepAlive = () => setInterval(extRuntime.getPlatformInfo, 20e3)
  extRuntime.onStartup.addListener(_keepAlive)
  _keepAlive()
}
