#!/usr/bin/env node
import init from "plasmo/src/commands/init"
import { argv, exit } from "process"

import { ErrorMessage } from "@plasmo/constants"
import { aLog, eLog, exitCountDown } from "@plasmo/utils"

async function main() {
  try {
    // In case someone pasted an essay into the cli
    if (argv.length > 10) {
      throw new Error(ErrorMessage.TooManyArg)
    }
    await init()
  } catch (e) {
    eLog((e as Error).message || ErrorMessage.Unknown)
    aLog(e.stack)
    await exitCountDown(3)
    exit(1)
  }
}

main()

process.on("SIGINT", () => exit(0))
process.on("SIGTERM", () => exit(0))
