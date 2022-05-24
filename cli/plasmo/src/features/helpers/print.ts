import { cLog } from "@plasmo/utils"

import { validCommandList } from "~commands"

export const printHeader = () => {
  console.log(`🟣 Plasmo v${process.env.APP_VERSION}`)

  console.log("🟠 The browser extension development framework.")
}

export const printHelp = () => cLog("🟡 MODES", validCommandList.join(" | "))
