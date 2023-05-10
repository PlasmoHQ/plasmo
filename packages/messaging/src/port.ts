import type { PortName } from "./index"

const portMap = new Map<PortName, chrome.runtime.Port>()

export const getPort = (name: PortName) => {
  const port = portMap.get(name)
  if (!!port) {
    return port
  }
  const newPort = chrome.runtime.connect({ name })
  portMap.set(name, newPort)
  return newPort
}

export const removePort = (name: PortName) => {
  portMap.delete(name)
}

export const listen = <ResponseBody = any>(
  name: PortName,
  handler: (msg: ResponseBody) => void,
  onReconnect?: () => void
) => {
  const port = getPort(name)

  function reconnectHandler() {
    removePort(name)
    onReconnect?.()
  }

  port.onMessage.addListener(handler)
  port.onDisconnect.addListener(reconnectHandler)

  return {
    port,
    disconnect: () => {
      port.onMessage.removeListener(handler)
      port.onDisconnect.removeListener(reconnectHandler)
    }
  }
}
