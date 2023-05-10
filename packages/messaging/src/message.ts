import { type PlasmoMessaging } from "./index"

export const listen = <RequestBody, ResponseBody>(
  handler: PlasmoMessaging.Handler<string, RequestBody, ResponseBody>
) => {
  const metaListener = async (req, sender, sendResponse) => {
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
    return // Syncronous return to indicate this is an async listener
  }

  chrome.runtime.onMessage.addListener(listener)
  return () => {
    chrome.runtime.onMessage.removeListener(listener)
  }
}
