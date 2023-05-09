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

export const delPort = (name: PortName) => {
  portMap.delete(name)
}