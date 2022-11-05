import { aLog, cLog } from "@plasmo/utils"

import { validCommandList } from "~commands"
import { flagHelp } from "~features/helpers/flag"

export const printHeader = () => {
  console.log(`🟣 Plasmo v${process.env.APP_VERSION}`)

  console.log("🔴 The Browser Extension Framework")
}

export const printHelp = () => {
  cLog("🟠 CMDS", validCommandList.join(" | "))

  cLog("🟡 OPTS", flagHelp)
}
