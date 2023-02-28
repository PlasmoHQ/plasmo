import type { SelectorMessage } from "./types"

export const querySelectors = (selectors: string[]) => {
  const result: Element[] = []
  const invalidSelectors: string[] = []
  for (const selector of selectors) {
    const element = document.querySelector(selector)
    if (!element) {
      invalidSelectors.push(selector)
    } else {
      result.push(element)
    }
  }

  try {
    if (invalidSelectors.length > 0) {
      chrome.runtime.sendMessage({
        name: "plasmo:selector:invalid",
        selectors: invalidSelectors
      } as SelectorMessage)
    }
  } catch {}

  return result
}

export const querySelector = (selector: string) => {
  const element = document.querySelector(selector)
  try {
    if (!element) {
      chrome.runtime.sendMessage({
        name: "plasmo:selector:invalid",
        selectors: [selector]
      })
    }
  } catch {}
  return element
}

export const querySelectorAll = (selector: string) => {
  const elements = document.querySelectorAll(selector)

  try {
    if (elements.length === 0) {
      chrome?.runtime?.sendMessage({
        name: "plasmo:selector:invalid",
        selectors: [selector]
      })
    }
  } catch {}

  return elements
}
