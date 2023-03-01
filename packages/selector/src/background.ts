import type { SelectorMessage } from "./types"

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
        await fetch(
          `${process.env.ITERO_MONITOR_API_BASE_URI}/api/selector/invalid`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              monitorId,
              selectors: message.selectors
            })
          }
        )
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
