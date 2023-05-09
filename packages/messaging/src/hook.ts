import { useEffect, useRef, useState } from "react"

import { type MessageName, type PlasmoMessaging, relayMessage } from "./index"
import { getPort, delPort } from "./port"
import { relay } from "./relay"

/**
 * Used in any extension context to listen and send messages to background.
 */
export const useMessage = <RequestBody, ResponseBody>(
  handler: PlasmoMessaging.Handler<string, RequestBody, ResponseBody>
) => {
  const [data, setData] = useState<RequestBody>()

  useEffect(() => {
    const metaListener = async (req, sender, sendResponse) => {
      setData(req.body)
      await handler?.(
        {
          ...req,
          sender
        },
        {
          send: (p) => sendResponse(p)
        }
      )
    }

    const listener = (req, sender, sendResponse) => {
      metaListener(req, sender, sendResponse)
      return
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => {
      chrome.runtime.onMessage.removeListener(listener)
    }
  }, [handler])

  return {
    data
  }
}

export const usePort: PlasmoMessaging.PortHook = (name) => {
  const portRef = useRef<chrome.runtime.Port>()
  const reConnectRef = useRef(0)
  const [data, setData] = useState()

  useEffect(() => {
      if (!name) {
          return null
      }

      const port = getPort(name)

      function messageHandler(msg) {
          setData(msg)
      }
      port.onMessage.addListener(messageHandler)

      function reConnectHandler() {
          delPort(name)
          reConnectRef.current = reConnectRef.current + 1
      }
      port.onDisconnect.addListener(reConnectHandler)

      portRef.current = port
      return () => {
          port.onMessage.removeListener(messageHandler)
          port.onDisconnect.removeListener(reConnectHandler)
      }
  }, [name, reConnectRef.current])

  return {
      data,
      send: (body) => {
          portRef.current.postMessage({
              name,
              body
          })
      }
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
