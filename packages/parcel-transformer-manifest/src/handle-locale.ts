import { resolve } from "path"

import { wLog } from "@plasmo/utils/logging"

import { addExtraAssets, state } from "./state"

export async function handleLocale() {
  const { program, asset, assetsDir } = state

  if (!program.default_locale) {
    return
  }

  const localesDir = resolve(assetsDir, "_locales")

  const localeDirExist = await asset.fs.exists(localesDir)

  if (!localeDirExist) {
    return
  }

  const localeEntries = await asset.fs.readdir(localesDir)

  if (localeEntries.length === 0) {
    return
  }

  if (!program.default_locale) {
    wLog(`default_locale not set, fallback to ${localeEntries[0]}`)
    program.default_locale = localeEntries[0]
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
      const localeFilePath = resolve(localesDir, locale, "messages.json")
      if (await asset.fs.exists(localeFilePath)) {
        const bundlePath = `_locales/${locale}/messages.json`

        await addExtraAssets(localeFilePath, bundlePath)
      }
    })
  )
}
