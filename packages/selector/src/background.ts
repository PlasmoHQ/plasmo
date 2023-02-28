import { Storage } from "@plasmohq/storage"

import type { SelectorMessage } from "./types"

const STORAGE_NAMESPACE = "__PLASMO_SELECTOR__"
const StorageKey = {
  API_KEY: "API_KEY"
} as const

async function selectorMessageHandler(message: SelectorMessage) {
  switch (message.name) {
    case "plasmo:selector:invalid": {
      const storage = new Storage()
      storage.setNamespace(STORAGE_NAMESPACE)
      const apiKey = await storage.get(StorageKey.API_KEY)
      if (!apiKey) {
        return
      }

      await fetch("https://itero.plasmo.com/api/selector/invalid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey
        },
        body: JSON.stringify({
          selectors: message.selectors
        })
      })
    }
  }
}

chrome.runtime.onMessage.addListener((message: SelectorMessage) => {
  selectorMessageHandler(message)
  return
})

export const init = async (apiKey: string) => {
  const storage = new Storage()
  storage.setNamespace(STORAGE_NAMESPACE)
  await storage.set(StorageKey.API_KEY, apiKey)
}
