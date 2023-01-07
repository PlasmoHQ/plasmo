import { WebSocket, WebSocketServer } from "ws"

const payload = JSON.stringify({ type: "build_ready" })

export const createBuildSocket = async (hmrPort: number) => {
  const wss = new WebSocketServer({ port: hmrPort + 1 })

  const triggerReload = () => {
    for (const client of wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload)
      }
    }
  }

  return {
    triggerReload
  }
}
