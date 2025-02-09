import { type PlasmoMessaging } from "./index"
import { getExtRuntime } from "./utils"

export const listen = <RequestBody, ResponseBody>(
  handler: PlasmoMessaging.Handler<string, RequestBody, ResponseBody>
) => {
  const metaListener = async (
    req: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: ResponseBody) => void
  ) => {
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

  const listener = (
    req: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: ResponseBody) => void
  ) => {
    metaListener(req, sender, sendResponse)
    return true // Synchronous return to indicate this is an async listener
  }

  getExtRuntime().onMessage.addListener(listener)
  return () => {
    getExtRuntime().onMessage.removeListener(listener)
  }
}
