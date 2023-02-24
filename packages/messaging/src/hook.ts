import { useEffect, useRef, useState } from "react"

import {
  type MessageName,
  type PlasmoMessaging,
  relayMessage,
  sendToBackground,
  sendToContentScript
} from "./index"
import { getPort } from "./port"
import { relay } from "./relay"
import type { InternalSignal } from "./types"
import { getActiveTab } from "./utils"

const _signalActiveCS: PlasmoMessaging.SendFx<InternalSignal> =
  sendToContentScript

/**
 * Used in any extension context to listen and send messages to background.
 */
export const useMessage = <RequestBody, ResponseBody>(
  handler: PlasmoMessaging.MessageHandler<RequestBody, ResponseBody>
): PlasmoMessaging.MessageHook<RequestBody> => {
  const [isReady, setIsReady] = useState(false)
  const [data, setData] = useState<RequestBody>()

  useEffect(() => {
    async function init() {
      // Send a ping to the content script to make sure it's ready before we establish communications
      await _signalActiveCS({ name: "__PLASMO_MESSAGING_PING__" })

      const tab = await getActiveTab()
      if (tab?.id) {
        setIsReady(true)
      }
    }

    init()
  }, [])

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
    data,
    async send(req) {
      if (!isReady) {
        throw new Error("Background Service not ready to receive message")
      }
      return await sendToBackground(req)
    }
  }
}

export const usePort: PlasmoMessaging.PortHook = (name) => {
  const portRef = useRef<chrome.runtime.Port>()
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

    portRef.current = port
    return () => {
      port.onMessage.removeListener(messageHandler)
    }
  }, [name])

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
