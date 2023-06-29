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
    <RequestBody = any, ResponseBody = any>(
      request: Request<TName, RequestBody>,
      messagePort?:
        | Pick<
            MessagePort,
            "addEventListener" | "removeEventListener" | "postMessage"
          >
        | Window
    ): Promise<ResponseBody>
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
    <TRequestBody = Record<string, any>, TResponseBody = any>(name: PortName): {
      data?: TResponseBody
      send: (payload: TRequestBody) => void
      listen: <T = TResponseBody>(
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

export type ChunkCollectionID = number;

export type MessageEventCallback = (message: unknown, port: chrome.runtime.Port) => void;

export interface Chunk {
  name: "__PLASMO_MESSAGING_CHUNK__"
  type: "init" | "end" | "data";
  index: number;
  chunkCollectionId: ChunkCollectionID;
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
