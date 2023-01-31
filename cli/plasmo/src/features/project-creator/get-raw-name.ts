import { createQuestId } from "mnemonic-id"

import { getNonFlagArgvs } from "@plasmo/utils/argv"
import { vLog } from "@plasmo/utils/logging"

import { quickPrompt } from "~features/helpers/prompt"

export const getRawName = async () => {
  const [rawNameNonInteractive] = getNonFlagArgvs("init")

  if (!!rawNameNonInteractive) {
    vLog("Using user-provided name:", rawNameNonInteractive)
    return rawNameNonInteractive
  }

  vLog("Prompting for the extension name")
  return await quickPrompt("Extension name:", createQuestId())
}
