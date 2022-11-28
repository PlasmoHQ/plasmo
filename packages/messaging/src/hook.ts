import { useEffect, useState } from "react"

import { relay, sendToBackground, sendToContentScript } from "./index"
import type { EventName, PlasmoMessaging } from "./types"
import { getActiveTab } from "./utils"

export type { PlasmoMessaging, EventName, Metadata } from "./types"

/**
 * Used in a tab page or sandbox page to send message to background.
 */
export const usePageMessaging: PlasmoMessaging.Hook = () => {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    async function init() {
      await sendToContentScript({ __internal: "__PLASMO_MESSAGING_PING__" })

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
        throw new Error("Background not ready to receive message")
      }
      return await sendToBackground(req)
    }
  }
}

/**
 * Perhaps add a way to detect if this hook is beign used inside CS?
 */
export const useRelay = (evetName: EventName) => {
  useEffect(() => relay(evetName), [])
}
