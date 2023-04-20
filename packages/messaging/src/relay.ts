import { nanoid } from "nanoid"

import type { PlasmoMessaging } from "./index"
import { isSameOrigin } from "./utils"

/**
 * Raw relay abstracting window.postMessage
 */
export const relay: PlasmoMessaging.RelayFx = (
  req,
  onMessage,
  messagePort = globalThis.window
) => {
  const relayHandler = async (
    event: MessageEvent<PlasmoMessaging.RelayMessage>
  ) => {
    if (isSameOrigin(event, req) && !event.data.relayed) {
      const relayPayload = {
        name: req.name,
        relayId: req.relayId,
        body: event.data.body
      }

      const backgroundResponse = await onMessage?.(relayPayload)

      messagePort.postMessage({
        name: req.name,
        relayId: req.relayId,
        instanceId: event.data.instanceId,
        body: backgroundResponse,
        relayed: true
      })
    }
  }

  messagePort.addEventListener("message", relayHandler)
  return () => messagePort.removeEventListener("message", relayHandler)
}

export const sendViaRelay: PlasmoMessaging.SendFx = (
  req,
  messagePort = globalThis.window
) =>
  new Promise((resolve, _reject) => {
    const instanceId = nanoid()

    messagePort.addEventListener(
      "message",
      (event: MessageEvent<PlasmoMessaging.RelayMessage>) => {
        if (
          isSameOrigin(event, req) &&
          event.data.relayed &&
          event.data.instanceId === instanceId
        ) {
          resolve(event.data.body)
        }
      }
    )

    messagePort.postMessage({
      ...req,
      instanceId
    } as PlasmoMessaging.RelayMessage)
  })
