export type PlasmoMessageRequest<T> = {
  name: string
  body: T
}

export type PlasmoMessageHandler<RequestBody = any, ResponseBody = any> = (
  request: PlasmoMessageRequest<RequestBody>,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: ResponseBody) => void
) => void | Promise<void>
