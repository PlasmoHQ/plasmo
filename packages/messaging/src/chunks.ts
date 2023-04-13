import { Chunk, InitChunk } from "./types";

const maxChunkSize = 5_000_000;

/**
 * Split large data into multiple chunks to
 * bypass the browser's limit on runtime messages.
 */
export function createChunksFromData(data: unknown): Chunk[] {
  // serialize data to buffer
  const jsonObj = JSON.stringify(data);
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
    name: "_PLASMO_MESSAGIN_CHUNK",
    type: i === byteGroup.length - 1 ? "end" : (i === 0 ? "init" : "data"),
    index: i,
    chunkCollectionId: collectionID,
    data: byteGroup
  }))

  // add total chunk length
  const initChunk = chunks.find((chunk) => chunk.type === "init") as InitChunk

  initChunk.totalChunks = chunks.length
  initChunk.dataLength = serialized.length;

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
  if (!initChunk || initChunk.totalChunks !== chunks.length || typeof initChunk.dataLength === "undefined") {
    throw new Error("Failed to validate init chunk: incomplete chunk array / no data length / no init chunk")
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
