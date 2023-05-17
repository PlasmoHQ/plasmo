import { relay as rawRelay, sendViaRelay as rawSendViaRelay } from "./relay"
import type { MessageName, PlasmoMessaging } from "./types"
import { getActiveTab } from "./utils"

export type {
  PlasmoMessaging,
  MessageName,
  PortName,
  PortsMetadata,
  MessagesMetadata,
  OriginContext
} from "./types"

/**
 * Should only be called from CS or Ext Pages
 * TODO: Add a framework runtime check, using a global variable
 */
export const sendToBackground: PlasmoMessaging.SendFx<MessageName> = async (
  req
) => {
  if (!chrome?.runtime) {
    throw new Error("chrome.runtime is not available")
  }
  return chrome.runtime.sendMessage(req)
}

/**
 * Send to CS from Ext pages or BGSW, default to active tab if no tabId is provided in the request
 */
export const sendToContentScript: PlasmoMessaging.SendFx = async (req) => {
  if (!chrome?.tabs) {
    throw new Error("chrome.tabs is not available")
  }
  const tabId =
    typeof req.tabId === "number" ? req.tabId : (await getActiveTab()).id

  return await chrome.tabs.sendMessage(tabId, req)
}

/**
 * @deprecated Renamed to `sendToContentScript`
 */

export const sendToActiveContentScript = sendToContentScript

/**
 * Any request sent to this relay get send to background, then emitted back as a response
 */
export const relayMessage: PlasmoMessaging.MessageRelayFx = (req) =>
  rawRelay(req, sendToBackground)

/**
 * @deprecated Migrated to `relayMessage`
 */
export const relay = relayMessage

export const sendToBackgroundViaRelay: PlasmoMessaging.SendFx<MessageName> =
  rawSendViaRelay

/**
 * @deprecated Migrated to `sendToBackgroundViaRelay`
 */
export const sendViaRelay = sendToBackgroundViaRelay
