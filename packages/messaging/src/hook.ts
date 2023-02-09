import { useEffect, useRef, useState } from "react"

import {
  type MessageName,
  type PlasmoMessaging,
  relayMessage,
  sendToActiveContentScript,
  sendToBackground
} from "./index"
import { getPort } from "./port"
import type { InternalSignal } from "./types"
import { getActiveTab } from "./utils"

const _signalActiveCS: PlasmoMessaging.SendFx<InternalSignal> =
  sendToActiveContentScript

/**
 * Used in an extension page or sandbox page to send message to background.
 */
export const usePageMessaging: PlasmoMessaging.MessageHook = () => {
  const [isReady, setIsReady] = useState(false)

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

  return {
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
export function useMessageRelay(name: MessageName) {
  useEffect(() => relayMessage(name), [])
}
