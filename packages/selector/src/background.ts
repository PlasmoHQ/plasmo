import type { SelectorMessage } from "./types"

// const MONITOR_API_BASE = "https://itero.plasmo.com"
const MONITOR_API_BASE = "http://localhost:3000"

async function selectorMessageHandler(
  message: SelectorMessage,
  monitorId: string
) {
  switch (message.name) {
    case "plasmo:selector:invalid": {
      if (!monitorId) {
        return
      }

      try {
        await fetch(`${MONITOR_API_BASE}/api/selector/invalid`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            monitorId,
            selectors: message.selectors
          })
        })
      } catch {}
    }
  }
}

export const init = ({ monitorId = "" }) => {
  chrome.runtime.onMessage.addListener((message: SelectorMessage) => {
    selectorMessageHandler(message, monitorId)
    return true
  })
}
