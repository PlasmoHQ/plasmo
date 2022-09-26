import { resolve } from "path"

import { vLog, wLog } from "@plasmo/utils/logging"

import { addExtraAssets, state } from "./state"

let warned = false

export async function handleLocales() {
  const { program, asset, assetsDir, projectDir } = state

  const localesDir = [
    resolve(projectDir, "locales"),
    resolve(assetsDir, "locales"),
    resolve(assetsDir, "_locales")
  ].find((dir) => asset.fs.existsSync(dir))

  if (!localesDir) {
    return
  }

  const localeEntries = await asset.fs.readdir(localesDir)

  if (localeEntries.length === 0) {
    vLog("No locale found, skipping")
    return
  }

  if (!program.default_locale) {
    program.default_locale = localeEntries[0]
    if (!warned) {
      warned = true
      wLog(`default_locale not set, fallback to ${localeEntries[0]}`)
    }
  }

  const defaultLocaleMessageExists = await asset.fs.exists(
    resolve(localesDir, program.default_locale, "messages.json")
  )

  if (!defaultLocaleMessageExists) {
    wLog("Default locale message.json not found, skipping locale!")
    delete program.default_locale
    return
  }

  await Promise.all(
    localeEntries.map(async (locale) => {
      vLog(`Adding locale ${locale}`)
      const localeFilePath = resolve(localesDir, locale, "messages.json")
      if (await asset.fs.exists(localeFilePath)) {
        const bundlePath = `_locales/${locale}/messages.json`
        state.asset.invalidateOnFileChange(localeFilePath)
        await addExtraAssets(localeFilePath, bundlePath)
      }
    })
  )
}
