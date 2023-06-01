export const keepAlive = () => {
  const extRuntime = (globalThis.browser.runtime ||
    globalThis.chrome.runtime) as typeof chrome.runtime
  const _keepAlive = () => setInterval(extRuntime.getPlatformInfo, 24_000) // 24 seconds
  extRuntime.onStartup.addListener(_keepAlive)
  _keepAlive()
}
