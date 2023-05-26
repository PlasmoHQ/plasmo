import type { PlasmoMessaging } from "./index"

// TODO: Move this to a broader utils package later on
const extRuntime = (globalThis.browser?.runtime ||
  globalThis.chrome?.runtime) as typeof chrome.runtime

const extTabs = (globalThis.browser?.tabs ||
  globalThis.chrome?.tabs) as typeof chrome.tabs

export const getExtRuntime = () => {
  if (!extRuntime) {
    throw new Error("Extension runtime is not available")
  }
  return extRuntime
}

export const getExtTabs = () => {
  if (!extTabs) {
    throw new Error("Extension tabs API is not available")
  }
  return extTabs
}

export const getActiveTab = async () => {
  const extTabs = getExtTabs()
  const [tab] = await extTabs.query({
    active: true,
    currentWindow: true
  })
  return tab
}

export const isSameOrigin = (
  event: MessageEvent,
  req: any
): req is PlasmoMessaging.Request =>
  !req.__internal &&
  event.source === globalThis.window &&
  event.data.name === req.name &&
  (req.relayId === undefined || event.data.relayId === req.relayId)

export const getRuntimeContext = () => {
  // If chrome API available but they cannot access
  // OR we can mark them directly (?), by injecting a tag at runtime itself
}
