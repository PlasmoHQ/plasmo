import type { PlasmoMessaging } from "./types"
import { getActiveTab, isSameOrigin as isSameTarget } from "./utils"

export type { MessageName, MessagesMetadata, PlasmoMessaging } from "./types"

/**
 * Should only be called from CS or Ext Pages
 * TODO: Add a framework runtime check, using a global varaible
 */
export const sendToBackground: PlasmoMessaging.SendFx = (req) =>
  new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(req, (res) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve(res)
      }
    })
  })

/**
 * Send to CS from Ext Pages
 */
export const sendToActiveContentScript: PlasmoMessaging.SendFx = (req) =>
  new Promise(async (resolve, reject) => {
    const tabId =
      typeof req.tabId === "number" ? req.tabId : (await getActiveTab()).id

    chrome.tabs.sendMessage(tabId, req, (res) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve(res)
      }
    })
  })

/**
 * From a webpage, send data to a cs, which gets to a bgsw via a window message
 * This relay should be called inside a cs. It listens for a specific eventName
 * Then it relay it back to bgsw, to which it resend the data back
 */
export const relay: PlasmoMessaging.RelayFx = (req, onMessage) => {
  const messageHandler = async (event: MessageEvent) => {
    if (isSameTarget(event, req) && !event.data.relayed) {
      const relayPayload = {
        name: req.name,
        relayId: req.relayId,
        body: event.data.body
      }

      onMessage?.(relayPayload)
      const backgroundResponse = await sendToBackground(relayPayload)

      window.postMessage({
        name: req.name,
        relayId: req.relayId,
        body: backgroundResponse,
        relayed: true
      })
    }
  }

  window.addEventListener("message", messageHandler)
  return () => window.removeEventListener("message", messageHandler)
}

export const sendViaRelay: PlasmoMessaging.SendFx = (req) =>
  new Promise((resolve, _reject) => {
    window.postMessage(req)

    // Maybe do a timeout and reject?
    window.addEventListener("message", (event) => {
      if (isSameTarget(event, req) && event.data.relayed) {
        resolve(event.data.body)
      }
    })
  })
