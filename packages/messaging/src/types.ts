export interface Metadata {}

export type EventName = keyof Metadata

export type InternalSignal = "__PLASMO_MESSAGING_PING__"

export namespace PlasmoMessaging {
  export type Request<TBody = any> = {
    name: EventName
    relayId?: string
    body?: TBody
  }

  export type InternalRequest = {
    __internal: InternalSignal
  }

  export type Handler<RequestBody = any, ResponseBody = any> = (
    request: Request<RequestBody> | InternalRequest,
    sender: chrome.runtime.MessageSender,
    sendResponse: (responseBody: ResponseBody) => void
  ) => void | Promise<void> | boolean

  export interface SendFx {
    <RequestBody = any, ResponseBody = any>(
      request: Request<RequestBody> | InternalRequest
    ): Promise<ResponseBody>
  }

  export interface RelayFx {
    <RequestBody = any>(
      request: Request<RequestBody> | InternalRequest
    ): () => void
  }

  export type Hook = () => {
    send: SendFx
  }
}

export type OriginContext =
  | "background"
  | "extension-page"
  | "sandbox-page"
  | "content-script"
  | "window"
