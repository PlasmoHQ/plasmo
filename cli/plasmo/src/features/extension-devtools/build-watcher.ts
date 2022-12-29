import { subscribe } from "@parcel/watcher"
import { WebSocket, WebSocketServer } from "ws"

import { PARCEL_WATCHER_BACKEND } from "@plasmo/constants/misc"

import type { PlasmoManifest } from "~features/manifest-factory/base"

const payload = JSON.stringify({ type: "build_ready" })

const DEBOUNCE_TIME = 740

let buildDebounceTimer: NodeJS.Timeout

export const createBuildWatcher = async (
  plasmoManifest: PlasmoManifest,
  hmrPort: number
) => {
  const wss = new WebSocketServer({ port: hmrPort + 1 })
  return subscribe(
    plasmoManifest.commonPath.buildDirectory,
    async (err) => {
      if (err) {
        throw err
      }

      clearTimeout(buildDebounceTimer)
      buildDebounceTimer = setTimeout(() => {
        for (const client of wss.clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(payload)
          }
        }
        clearTimeout(buildDebounceTimer)
      }, DEBOUNCE_TIME)
    },
    {
      backend: PARCEL_WATCHER_BACKEND
    }
  )
}
