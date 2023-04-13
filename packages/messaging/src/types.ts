export interface MessagesMetadata {}
export interface PortsMetadata {}

export type MessageName = keyof MessagesMetadata
export type PortName = keyof PortsMetadata

export type InternalSignal = "__PLASMO_MESSAGING_PING__"

export namespace PlasmoMessaging {
  export type Request<TName = any, TBody = any> = {
    name: TName

    port?: chrome.runtime.Port
    sender?: chrome.runtime.MessageSender

    body?: TBody
    tabId?: number
    relayId?: string
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
    <RequestBody = any, ResponseBody = any>(
      request: Request<TName, RequestBody>
    ): Promise<ResponseBody>
  }

  export interface RelayFx {
    <RelayName = any, RequestBody = any, ResponseBody = any>(
      request: Request<RelayName, RequestBody>,
      onMessage?: (
        request: Request<RelayName, RequestBody>
      ) => Promise<ResponseBody>
    ): () => void
  }

  export interface MessageRelayFx {
    <RequestBody = any>(request: Request<MessageName, RequestBody>): () => void
  }

  export interface PortHook {
    <TRequestBody = Record<string, any>, TResponseBody = any>(name: PortName): {
      data: TResponseBody
      send: (payload: TRequestBody) => void
    }
  }
}

export type OriginContext =
  | "background"
  | "extension-page"
  | "sandbox-page"
  | "content-script"
  | "window"

export interface Chunk {
  type: "init" | "end" | "data";
  index: number;
  chunkCollectionId: number;
  data: number[];
}

export interface InitChunk extends Chunk {
  type: "init";
  dataLength: number;
  totalChunks: number;
}

export interface DataChunk extends Chunk {
  type: "data";
}

export interface EndChunk extends Chunk {
  type: "end";
}
