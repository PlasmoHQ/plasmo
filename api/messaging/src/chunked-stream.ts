import type {
  Chunk,
  ChunkCollectionID,
  InitChunk,
  MessageEventCallback,
  PortName
} from "./types"
import { getExtRuntime } from "./utils"

const maxChunkSize = 4_200_000

/**
 * Split large data into multiple chunks to
 * bypass the browser's limit on runtime messages.
 */
export function createChunksFromData(data: unknown): Chunk[] {
  // serialize data to buffer
  const jsonObj = JSON.stringify(data)
  const serialized = new TextEncoder().encode(jsonObj)

  // split serialized data
  const bytes: number[][] = []

  for (let i = 0; i < serialized.length; i++) {
    const chunk = Math.floor(i / maxChunkSize)

    if (!bytes[chunk]) bytes[chunk] = []

    bytes[chunk].push(serialized[i])
  }

  // create a chunk collection ID
  const collectionID = Math.floor(Math.random() * 100)

  // create chunks
  const chunks: Chunk[] = bytes.map((byteGroup, i) => ({
    name: "__PLASMO_MESSAGING_CHUNK__",
    type: i === byteGroup.length - 1 ? "end" : i === 0 ? "init" : "data",
    index: i,
    chunkCollectionId: collectionID,
    data: byteGroup
  }))

  // add total chunk length
  const initChunk = chunks.find((chunk) => chunk.type === "init") as InitChunk

  initChunk.totalChunks = chunks.length
  initChunk.dataLength = serialized.length

  return chunks
}

/**
 * Reconstruct split data from "createChunksFromData()"
 */
export function buildDataFromChunks<T = unknown>(chunks: Chunk[]): T {
  // find the init chunk
  const initChunk = chunks.find((chunk) => chunk.type === "init") as InitChunk

  // validate init chunk and check if
  // the chunks are complete
  if (
    !initChunk ||
    initChunk.totalChunks !== chunks.length ||
    typeof initChunk.dataLength === "undefined"
  ) {
    throw new Error(
      "Failed to validate init chunk: incomplete chunk array / no data length / no init chunk"
    )
  }

  // initialize the encoded data
  const encoded = new Uint8Array(initChunk.dataLength)

  // sort chunks by their index
  // this is to make sure we are
  // setting the encoded bytes in
  // the correct order
  chunks.sort((a, b) => a.index - b.index)

  // set bytes
  for (let i = 0; i < chunks.length; i++) {
    encoded.set(chunks[i].data, chunks[i - 1]?.data?.length || 0)
  }

  // decode the data
  const serialized = new TextDecoder().decode(encoded)
  const obj: T = JSON.parse(serialized)

  return obj
}

/**
 * Advanced chunked streaming port extending the default
 * chrome.runtime.Port
 */
export const createChunkedStreamPort = (
  name: PortName
): chrome.runtime.Port => {
  // connect to the port
  const port = getExtRuntime().connect({ name })

  // chunk map
  const chunkMap = new Map<ChunkCollectionID, Chunk[]>()

  // intercepted event listeners map
  // Map format: key - original handler, value - interceptor
  const listenerMap = new Map<MessageEventCallback, MessageEventCallback>()

  // setup interceptor
  return {
    ...port,
    postMessage(message: unknown) {
      // split chunks
      const chunks = createChunksFromData(message)

      // get if chunks are needed
      // if not, just send the message
      if (chunks.length >= 1) {
        return port.postMessage(message)
      }

      // send chunks
      for (let i = 0; i < chunks.length; i++) {
        port.postMessage(chunks[i])
      }
    },
    onMessage: {
      ...port.onMessage,
      addListener(callback: MessageEventCallback) {
        // interceptor for the chunks
        const interceptor: MessageEventCallback = (message: Chunk, port) => {
          // only handle chunks
          if (message?.name !== "__PLASMO_MESSAGING_CHUNK__") {
            return callback(message, port)
          }

          // check if a group exists for this
          // chunk in the chunkMap
          let group = chunkMap.get(message.chunkCollectionId)

          // if the group exists, add chunk to it
          // otherwise create the group
          if (!!group) group.push(message)
          else chunkMap.set(message.chunkCollectionId, [message])

          // update group (in case it was undefined before)
          group = chunkMap.get(message.chunkCollectionId)

          // check if all chunks have been received
          const initChunk = group.find(
            (chunk) => chunk.type === "init"
          ) as InitChunk

          if (group.length !== initChunk.totalChunks) return

          // check if the listener is present
          if (!listenerMap.get(callback)) return

          // build message data
          const data = buildDataFromChunks(group)

          // call original listener to handle
          // the reconstructed message
          return callback(data, port)
        }

        // add listener
        port.onMessage.addListener(interceptor)

        // map listener
        listenerMap.set(callback, interceptor)
      },
      removeListener(callback: MessageEventCallback) {
        // remove listener from the original port
        port.onMessage.removeListener(listenerMap.get(callback))

        // remove listener from listener map
        listenerMap.delete(callback)
      }
    }
  }
}
