import { type PlasmoMessaging } from "./index"
import { getExtRuntime } from "./utils"

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

  getExtRuntime().onMessage.addListener(listener)
  return () => {
    getExtRuntime().onMessage.removeListener(listener)
  }
}
