import type { SelectorMessage } from "./types"

// Simple cache, it won't persist, but it will do for now
const softCache = new Set()

async function selectorMessageHandler(
  message: SelectorMessage,
  monitorId: string,
  sample: number
) {
  switch (message.name) {
    case "plasmo:selector:invalid": {
      if (!monitorId) {
        return
      }

      const body = JSON.stringify({
        monitorId,
        payload: message.payload
      })

      if (softCache.has(body) || Math.random() > sample) {
        return
      }

      try {
        softCache.add(body)
        await fetch(
          `${process.env.ITERO_MONITOR_API_BASE_URI}/api/selector/invalid`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body
          }
        )
      } catch {}
    }
  }
}

/**
 * @param monitorId id of the monitor to send invalid selectors to
 * @param sample percentage of invalid selectors to send to the monitor, default 47%
 */
export const init = ({ monitorId = "", sample = 0.47 }) => {
  chrome.runtime.onMessage.addListener((message: SelectorMessage) => {
    selectorMessageHandler(message, monitorId, sample)
    return true
  })
}
