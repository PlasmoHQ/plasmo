#!/usr/bin/env node
import { argv, exit, versions } from "process"

import { ErrorMessage } from "@plasmo/constants"
import { aLog, eLog, exitCountDown, iLog } from "@plasmo/utils"

async function main() {
  try {
    // In case someone pasted an essay into the cli
    if (argv.length > 10) {
      throw new Error(ErrorMessage.TooManyArg)
    }

    iLog("HELLO WORLD 147")
    iLog("NODE version: ", versions.node)
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
