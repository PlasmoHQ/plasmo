import { createChunkedStreamPort } from "./chunked-stream"
import type { PortKey, PortName } from "./index"
import { getExtRuntime } from "./utils"

const portMap = new Map<PortName, chrome.runtime.Port>()

export const getPort = (portKey: PortKey) => {
  const portName = typeof portKey === "string" ? portKey : portKey.name
  const isChunked = typeof portKey !== "string" && portKey.isChunked

  const port = portMap.get(portName)

  if (!!port) {
    return port
  }
  const newPort = isChunked
    ? createChunkedStreamPort(portName)
    : getExtRuntime().connect({ name: portName })

  portMap.set(portName, newPort)
  return newPort
}

export const removePort = (portKey: PortKey) => {
  portMap.delete(typeof portKey === "string" ? portKey : portKey.name)
}

export const listen = <ResponseBody = any>(
  portKey: PortKey,
  handler: (msg: ResponseBody) => Promise<void> | void,
  onReconnect?: () => void
) => {
  const port = getPort(portKey)

  function reconnectHandler() {
    removePort(portKey)
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
