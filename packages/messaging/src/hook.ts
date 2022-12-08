import { useEffect, useState } from "react"

import {
  messageRelay,
  sendToActiveContentScript,
  sendToBackground
} from "./index"
import type {
  InternalSignal,
  MessageName,
  PlasmoMessaging,
  PortName
} from "./types"
import { getActiveTab } from "./utils"

export type {
  PlasmoMessaging,
  MessageName as EventName,
  MessagesMetadata as Metadata
} from "./types"

const _sendToActiveCS: PlasmoMessaging.SendFx<InternalSignal> =
  sendToActiveContentScript

/**
 * Used in a tab page or sandbox page to send message to background.
 */
export const usePageMessaging: PlasmoMessaging.Hook = () => {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    async function init() {
      // Send something to contentscript to make sure it's ready before we establish comms
      await _sendToActiveCS({ name: "__PLASMO_MESSAGING_PING__" })

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

export const usePort = (name: PortName) => {}

/**
 * Perhaps add a way to detect if this hook is beign used inside CS?
 */
export const useMessageRelay = (name: MessageName) => {
  useEffect(() => messageRelay(name), [])
}
