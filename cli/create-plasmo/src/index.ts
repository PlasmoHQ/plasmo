#!/usr/bin/env node
import { argv, exit } from "process"
import { version } from "plasmo/package.json"
import init from "plasmo/src/commands/init"

import { ErrorMessage } from "@plasmo/constants/error"
import { aLog, eLog } from "@plasmo/utils/logging"
import { exitCountDown } from "@plasmo/utils/wait"

process.env.APP_VERSION = version

async function main() {
  try {
    // In case someone pasted an essay into the cli
    if (argv.length > 10) {
      throw new Error(ErrorMessage.TooManyArg)
    }

    argv.splice(2, 0, "init")

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
