import type { PlasmoMessaging } from "./types"
import { getActiveTab, isSameOrigin as isSameTarget } from "./utils"

export type { PlasmoMessaging, EventName, Metadata } from "./types"

/**
 * Should only be called from CS or Ext Pages
 */
export const sendToBackground: PlasmoMessaging.SendFx = (req) =>
  new Promise((resolve, reject) =>
    chrome.runtime.sendMessage(req, (res) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve(res)
      }
    })
  )

/**
 * Send to CS from Ext Pages to CS
 */
export const sendToContentScript: PlasmoMessaging.SendFx = (req) =>
  new Promise(async (resolve, reject) => {
    const tab = await getActiveTab()

    chrome.tabs.sendMessage(tab.id, req, (res) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
      } else {
        resolve(res)
      }
    })
  })

/**
 * From a webpage, send data to a CS, which get to bgsw via window message
 * This relay should get be called inside a CS it listen to a specific eventName
 * Then it relay it back to bgsw, to which it resend the data back
 */
export const relay: PlasmoMessaging.RelayFx = (req) => {
  const messageHandler = async (event: MessageEvent) => {
    if (isSameTarget(event, req) && !event.data.relayed) {
      const backgroundResponse = await sendToBackground({
        name: req.name,
        relayId: req.relayId,
        body: event.data.body
      })

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

export const sendThroughRelay: PlasmoMessaging.SendFx = (req) =>
  new Promise((resolve, reject) => {
    window.postMessage(req)

    // Maybe do a timeout and reject?
    window.addEventListener("message", (event) => {
      if (isSameTarget(event, req) && event.data.relayed) {
        resolve(event.data.body)
      }
    })
  })
