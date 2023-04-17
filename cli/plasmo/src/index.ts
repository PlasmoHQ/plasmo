#!/usr/bin/env node
import { argv, exit, versions } from "process"
import semver from "semver"

import { ErrorMessage } from "@plasmo/constants/error"
import { verbose } from "@plasmo/utils/flags"
import { eLog, vLog } from "@plasmo/utils/logging"
import { exitCountDown } from "@plasmo/utils/wait"

import { type ValidCommand, runMap, validCommandSet } from "~commands"
import { printHeader, printHelp } from "~features/helpers/print"

async function defaultMode() {
  printHeader()

  printHelp()
}

async function main() {
  try {
    // In case someone pasted an essay into the cli
    if (argv.length > 10) {
      throw new Error(ErrorMessage.TooManyArg)
    }

    if (semver.major(versions.node) < 16) {
      throw new Error("Node version must be >= 16")
    }

    process.env.VERBOSE = verbose ? "true" : "false"

    // Setting startup policy/daemon
    const mode = argv.find((arg) =>
      validCommandSet.has(arg as ValidCommand)
    ) as ValidCommand

    if (mode in runMap) {
      vLog("Running command:", mode)

      const { default: runner } = await runMap[mode]()

      await runner()
    } else {
      vLog("Running default mode")
      await defaultMode()
    }
  } catch (e: any) {
    eLog((e as Error).message || ErrorMessage.Unknown)
    vLog(e.stack)
    await exitCountDown(3)
    exit(1)
  }
}

main()

process.on("SIGINT", () => exit(0))
process.on("SIGTERM", () => exit(0))
