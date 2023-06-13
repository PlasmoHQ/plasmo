import { WebSocket, WebSocketServer } from "ws"

export enum BuildSocketEvent {
  BuildReady = "build_ready",
  CsChanged = "cs_changed"
}

const createBuildSocket = (hmrPort: number) => {
  const wss = new WebSocketServer({ port: hmrPort + 1 })

  const broadcast = (type: BuildSocketEvent) => {
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type }))
      }
    }
  }

  return {
    broadcast
  }
}

let _buildSocket: Awaited<ReturnType<typeof createBuildSocket>>

export const getBuildSocket = (hmrPort?: number) => {
  if (hmrPort === undefined) {
    if (!_buildSocket) {
      throw new Error("Build socket not initialized")
    }
    return _buildSocket
  }

  _buildSocket = createBuildSocket(hmrPort)
  return _buildSocket
}
