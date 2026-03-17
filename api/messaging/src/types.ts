export interface MessagesMetadata {}
export interface PortsMetadata {}

export type MessageName = keyof MessagesMetadata
export type PortName = keyof PortsMetadata

export type InternalSignal = "__PLASMO_MESSAGING_PING__"

export namespace PlasmoMessaging {
  export type Request<TName = any, TBody = any> = {
    name: TName

    extensionId?: string
    port?: chrome.runtime.Port
    sender?: chrome.runtime.MessageSender

    body?: TBody
    tabId?: number
    relayId?: string

    // Target origin to send the message to (for relay), default to "/"
    targetOrigin?: string
  }

  export type RelayMessage<TName = any, TBody = any> = Request<TName, TBody> & {
    /**
     * Used to resolve corresponding window.postMessage messages
     */
    instanceId: string
    relayed: boolean
  }

  export type InternalRequest = {
    __PLASMO_INTERNAL_SIGNAL__: InternalSignal
  }

  export type Response<TBody = any> = {
    send: (body: TBody) => void
  }

  export type InternalHandler = (request: InternalRequest) => void

  export type Handler<
    RequestName = string,
    RequestBody = any,
    ResponseBody = any
  > = (
    request: Request<RequestName, RequestBody>,
    response: Response<ResponseBody>
  ) => void | Promise<void> | boolean

  export type PortHandler<RequestBody = any, ResponseBody = any> = Handler<
    PortName,
    RequestBody,
    ResponseBody
  >

  export type MessageHandler<RequestBody = any, ResponseBody = any> = Handler<
    MessageName,
    RequestBody,
    ResponseBody
  >

  export interface SendFx<TName = string> {
    <TSpecificName extends TName>(
      request: Request<
        TSpecificName,
        TSpecificName extends keyof MessagesMetadata
          ? MessagesMetadata[TSpecificName] extends { req: infer R }
            ? R
            : any
          : any
      >,
      messagePort?:
        | Pick<
            MessagePort,
            "addEventListener" | "removeEventListener" | "postMessage"
          >
        | Window
    ): Promise<
      TSpecificName extends keyof MessagesMetadata
        ? MessagesMetadata[TSpecificName] extends { res: infer R }
          ? R
          : any
        : any
    >
  }

  export interface RelayFx {
    <RelayName = any, RequestBody = any, ResponseBody = any>(
      request: Request<RelayName, RequestBody>,
      onMessage?: (
        request: Request<RelayName, RequestBody>
      ) => Promise<ResponseBody>,
      messagePort?:
        | Pick<
            MessagePort,
            "addEventListener" | "removeEventListener" | "postMessage"
          >
        | Window
    ): () => void
  }

  export interface MessageRelayFx {
    <RequestBody = any>(request: Request<MessageName, RequestBody>): () => void
  }

  export interface PortHook {
    <TName extends PortName>(
      name: TName
    ): {
      data?: TName extends keyof PortsMetadata
        ? PortsMetadata[TName] extends { res: infer R }
          ? R
          : any
        : any
      send: (
        payload: TName extends keyof PortsMetadata
          ? PortsMetadata[TName] extends { req: infer R }
            ? R
            : any
          : any
      ) => void
      listen: <
        T = TName extends keyof PortsMetadata
          ? PortsMetadata[TName] extends { res: infer R }
            ? R
            : any
          : any
      >(
        handler: (msg: T) => void
      ) => {
        port: chrome.runtime.Port
        disconnect: () => void
      }
    }
  }
}

export type OriginContext =
  | "background"
  | "extension-page"
  | "sandbox-page"
  | "content-script"
  | "window"
