import { nanoid } from "nanoid"

import type { PlasmoMessaging } from "./index"
import { isSameOrigin } from "./utils"

/**
 * Raw relay abstracting window.postMessage
 */
export const relay: PlasmoMessaging.RelayFx = (req, onMessage) => {
  const relayHandler = async (event: MessageEvent) => {
    if (isSameOrigin(event, req) && !event.data.relayed) {
      const relayPayload = {
        name: req.name,
        relayId: req.relayId,
        body: event.data.body
      }

      const backgroundResponse = await onMessage?.(relayPayload)

      window.postMessage({
        name: req.name,
        relayId: req.relayId,
        instanceId: event.data.instanceId,
        body: backgroundResponse,
        relayed: true
      })
    }
  }

  window.addEventListener("message", relayHandler)
  return () => window.removeEventListener("message", relayHandler)
}

export const sendViaRelay: PlasmoMessaging.SendFx = (req) =>
  new Promise((resolve, _reject) => {
    req.instanceId = nanoid()

    window.addEventListener("message", (event) => {
      if (
        isSameOrigin(event, req) &&
        event.data.relayed &&
        event.data.instanceId === req.instanceId
      ) {
        resolve(event.data.body)
      }
    })

    window.postMessage(req)
  })
