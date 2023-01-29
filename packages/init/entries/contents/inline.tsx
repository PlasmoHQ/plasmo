import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://www.plasmo.com/*"]
}

export const getInlineAnchor: PlasmoGetInlineAnchor = () =>
  document.querySelector("#supercharge > h2 > span")

// Use this to optimize unmount lookups
export const getShadowHostId = () => "plasmo-inline-example-unique-id"

const PlasmoInline = () => {
  return <button>Custom button</button>
}

export default PlasmoInline
