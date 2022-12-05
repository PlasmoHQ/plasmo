import { subscribe } from "@parcel/watcher"
import { WebSocket, WebSocketServer } from "ws"

import { PARCEL_WATCHER_BACKEND } from "@plasmo/constants/misc"

import type { BaseFactory } from "~features/manifest-factory/base"

export const createBuildWatcher = async (
  plasmoManifest: BaseFactory,
  hmrPort: number
) => {
  const wss = new WebSocketServer({ port: hmrPort + 1 })
  return subscribe(
    plasmoManifest.commonPath.buildDirectory,
    async (err, events) => {
      if (err) {
        throw err
      }

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "build_ready" }))
        }
      })
    },
    {
      backend: PARCEL_WATCHER_BACKEND
    }
  )
}
