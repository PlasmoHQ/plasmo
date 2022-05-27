#!/usr/bin/env node
import { argv, exit } from "process"

import { ErrorMessage, ManifestContentScript } from "@plasmo/constants"
import { aLog, eLog, exitCountDown, vLog } from "@plasmo/utils"

import { ValidCommand, runMap, validCommandSet } from "~commands"
import { printHeader, printHelp } from "~features/helpers/print"

export type PlasmoContentScript = Omit<Partial<ManifestContentScript>, "js">

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
