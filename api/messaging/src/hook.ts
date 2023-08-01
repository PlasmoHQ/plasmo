import { useEffect, useRef, useState } from "react"

import { relayMessage, type MessageName, type PlasmoMessaging } from "./index"
import { listen as messageListen } from "./message"
import { listen as portListen } from "./port"
import { relay } from "./relay"

/**
 * Used in any extension context to listen and send messages to background.
 */
export const useMessage = <RequestBody, ResponseBody>(
  handler: PlasmoMessaging.Handler<string, RequestBody, ResponseBody>
) => {
  const [data, setData] = useState<RequestBody>()

  useEffect(
    () =>
      messageListen<RequestBody, ResponseBody>(async (req, res) => {
        setData(req.body)
        await handler(req, res)
      }),
    [handler]
  )

  return {
    data
  }
}

export const usePort: PlasmoMessaging.PortHook = (name) => {
  const portRef = useRef<chrome.runtime.Port>()
  const reconnectRef = useRef(0)
  const [data, setData] = useState()

  useEffect(() => {
    if (!name) {
      return null
    }

    const { port, disconnect } = portListen(
      name,
      (msg) => {
        setData(msg)
      },
      () => {
        reconnectRef.current = reconnectRef.current + 1
      }
    )

    portRef.current = port
    return disconnect
  }, [
    name,
    reconnectRef.current // This is needed to force a new port ref
  ])

  return {
    data,
    send: (body) => {
      portRef.current.postMessage({
        name,
        body
      })
    },
    listen: (handler) => portListen(name, handler)
  }
}

/**
 * TODO: Perhaps add a way to detect if this hook is being used inside CS?
 */
export function useMessageRelay<RequestBody = any>(
  req: PlasmoMessaging.Request<MessageName, RequestBody>
) {
  useEffect(() => relayMessage(req), [])
}

export const useRelay: PlasmoMessaging.RelayFx = (req, onMessage) => {
  const relayRef = useRef<() => void>()

  useEffect(() => {
    relayRef.current = relay(req, onMessage)
    return relayRef.current
  }, [])

  return () => relayRef.current?.()
}
