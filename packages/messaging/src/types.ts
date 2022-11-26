export interface Metadata {}

export type EventName = keyof Metadata
export namespace PlasmoMessaging {
  export type Request<T = any> = {
    name: EventName
    body: T
  }

  export type Handler<RequestBody = any, ResponseBody = any> = (
    request: Request<RequestBody>,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: ResponseBody) => void
  ) => void | Promise<void> | boolean

  export type Hook = (eventName: EventName) => {
    send<RequestBody = any, ResponseBody = any>(
      body?: RequestBody
    ): Promise<ResponseBody>
  }
}
