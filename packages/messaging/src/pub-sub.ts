import { getExtRuntime } from "./utils"

export type PubSubMessage = {
  from?: number
  to?: number
  payload: any
}

// Only usable from BGSW
export const getHubMap = (): Map<number, chrome.runtime.Port> =>
  globalThis.__plasmoInternalHubMap

// Only usable by BGSW
export const startHub = () => {
  const runtime = getExtRuntime()
  if (!runtime.onConnectExternal) {
    throw new Error(
      "onConnect External not available. You need externally_connectable entry possibly"
    )
  }

  globalThis.__plasmoInternalHubMap = new Map()
  const hub = getHubMap()

  runtime.onConnectExternal.addListener((port) => {
    const tabId = port.sender.tab.id
    if (!hub.has(tabId)) {
      hub.set(tabId, port)
      port.onMessage.addListener((message) => {
        broadcast({ from: tabId, payload: message })
      })
      port.onDisconnect.addListener(() => {
        //TODO - Should we log?
        hub.delete(tabId)
      })
    }
  })
}

// Only usable by BGSW
export const broadcast = (pubSubMessage: PubSubMessage) => {
  const hub = getHubMap()
  hub.forEach((port, tabId) => {
    const skipBroadcast = tabId === pubSubMessage.from
    if (skipBroadcast) {
      return
    }
    port.postMessage({ ...pubSubMessage, to: tabId })
  })
}

export const connectToHub = (extensionId: string) => {
  const runtime = getExtRuntime()
  if (!runtime.connect) {
    throw new Error(
      "runtime.connect not available. You need to use startHub in BGSW"
    )
  }
  const port = runtime.connect(extensionId)
  return port
}
