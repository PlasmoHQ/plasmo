import type { EventName, PlasmoMessaging } from "./types"

export const getPortMap = (): Map<EventName, chrome.runtime.Port> =>
  globalThis.__plasmoInternalPortMap

export const getPort = (name: EventName): chrome.runtime.Port => {
  const portMap = getPortMap()
  const port = portMap.get(name)
  if (!port) {
    throw new Error(`Port ${name} not found`)
  }
  return port
}

chrome.runtime.onMessage.addListener(
  (request: PlasmoMessaging.InternalRequest, _sender, sendResponse) => {
    switch (request.__internal) {
      case "__PLASMO_MESSAGING_PING__":
        sendResponse(true)
        break
    }

    return true
  }
)
