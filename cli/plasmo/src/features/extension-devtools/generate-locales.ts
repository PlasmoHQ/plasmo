import { copy, existsSync } from "fs-extra"
import { resolve } from "path"

import { vLog } from "@plasmo/utils"

import type { CommonPath } from "./common-path"

export async function generateLocales({
  assetsDirectory,
  dotPlasmoDirectory
}: CommonPath) {
  const localesDirPath = resolve(assetsDirectory, "_locales")

  if (existsSync(localesDirPath)) {
    vLog(`Generating locales!`)
    const genLocalesDirPath = resolve(dotPlasmoDirectory, "_locales")
    await copy(localesDirPath, genLocalesDirPath)
  }
}
