import type { Chunk, ChunkCollectionID, InitChunk, MessageEventCallback } from "./types"
import { buildDataFromChunks, createChunksFromData } from "./chunks"
import type { PortName } from "./index"

const portMap = new Map<PortName, chrome.runtime.Port>()

/**
 * Plasmo advanced port extending the default
 * chrome.runtime.Port
 */
const PlasmoPort = (name: PortName) => {
  // connect to the port
  const port = chrome.runtime.connect({ name })

  // chunk map
  const chunkMap = new Map<ChunkCollectionID, Chunk[]>()

  // intercepted event listeners map
  // Map format: key - original handler, value - interceptor
  const listenerMap = new Map<MessageEventCallback, MessageEventCallback>()

  // setup interceptor
  const interceptor: chrome.runtime.Port = {
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
          if (message?.name !== "_PLASMO_MESSAGIN_CHUNK") {
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
          const initChunk = group.find((chunk) => chunk.type === "init") as InitChunk

          if (group.length !== initChunk.totalChunks) return

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

  return interceptor
}

export const getPort = (name: PortName) => {
  const port = portMap.get(name)
  if (!!port) {
    return port
  }
  const newPort = PlasmoPort(name)
  portMap.set(name, newPort)
  return newPort
}
