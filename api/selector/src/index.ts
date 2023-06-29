import type { SelectorMessage } from "./types"

async function sendInvalidSelectors(selectors: string[]) {
  try {
    return await chrome?.runtime?.sendMessage({
      name: "plasmo:selector:invalid",
      payload: {
        selectors,
        url: window.location.href
      }
    } as SelectorMessage)
  } catch {}
}

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

  if (invalidSelectors.length > 0) {
    sendInvalidSelectors(invalidSelectors)
  }

  return result
}

export const querySelector = (selector: string) => {
  const element = document.querySelector(selector)
  if (!element) {
    sendInvalidSelectors([selector])
  }

  return element
}

export const querySelectorAll = (selector: string) => {
  const elements = document.querySelectorAll(selector)

  if (elements.length === 0) {
    sendInvalidSelectors([selector])
  }

  return elements
}
