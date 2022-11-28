import type { PlasmoMessaging } from "./types"

export const getActiveTab = async () => {
  const [tab] = await chrome.tabs.query({
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
