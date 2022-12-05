import { subscribe } from "@parcel/watcher"
import { WebSocket, WebSocketServer } from "ws"

import { PARCEL_WATCHER_BACKEND } from "@plasmo/constants/misc"

import type { BaseFactory } from "~features/manifest-factory/base"

const payload = JSON.stringify({ type: "build_ready" })

export const createBuildWatcher = async (
  plasmoManifest: BaseFactory,
  hmrPort: number
) => {
  const wss = new WebSocketServer({ port: hmrPort + 1 })
  return subscribe(
    plasmoManifest.commonPath.buildDirectory,
    async (err) => {
      if (err) {
        throw err
      }

      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload)
        }
      })
    },
    {
      backend: PARCEL_WATCHER_BACKEND
    }
  )
}
