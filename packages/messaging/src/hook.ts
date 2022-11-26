import { useEffect } from "react"

import type { EventName, PlasmoMessaging } from "./types"

export type { PlasmoMessaging, EventName, Metadata } from "./types"

export const useMessaging: PlasmoMessaging.Hook = (eventName) => {
  useEffect(() => {}, [])

  return {
    send: (body) =>
      new Promise((resolve, reject) =>
        chrome.runtime.sendMessage({ name: eventName, body }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError)
          } else {
            resolve(response)
          }
        })
      )
  }
}
