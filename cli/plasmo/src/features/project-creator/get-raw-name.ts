import { createQuestId } from "mnemonic-id"

import { getNonFlagArgvs } from "@plasmo/utils/argv"
import { vLog } from "@plasmo/utils/logging"

export const getRawName = async () => {
  const [rawNameNonInteractive] = getNonFlagArgvs("init")

  if (!!rawNameNonInteractive) {
    vLog("Using user-provided name:", rawNameNonInteractive)
    return rawNameNonInteractive
  }

  const {
    default: { prompt }
  } = await import("inquirer")

  vLog("Prompting for the extension name")
  const { rawName } = await prompt({
    name: "rawName",
    prefix: "🟡",
    message: "Extension name:",
    default: createQuestId()
  })
  return rawName
}
