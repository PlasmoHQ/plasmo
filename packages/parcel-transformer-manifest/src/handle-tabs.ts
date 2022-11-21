import { resolve } from "path"

import { vLog } from "@plasmo/utils/logging"

import { getState } from "./state"

export async function handleTabs() {
  const { asset, dotPlasmoDir, srcDir } = getState()
  const srcTabsDir = resolve(srcDir, "tabs")
  const dotTabsDir = resolve(dotPlasmoDir, "tabs")

  const [dotTabsDirExists, srcTabsDirExists] = await Promise.all([
    asset.fs.exists(dotTabsDir),
    asset.fs.exists(srcTabsDir)
  ])

  if (!dotTabsDirExists || !srcTabsDirExists) {
    return
  }

  const tabsEntries = await asset.fs.readdir(srcTabsDir)

  if (tabsEntries.length === 0) {
    vLog(`No tab found in ${srcTabsDir}, skipping`)
    return
  }

  const entryNames = tabsEntries.map((entry) => {
    const token = entry.split(".")
    token.pop()
    return [entry, `${token.join(".")}.html`]
  })

  await Promise.all(
    entryNames.map(async ([entry, htmlEntry]) => {
      const entryPath = resolve(dotTabsDir, htmlEntry)
      const srcEntryPath = resolve(srcTabsDir, entry)
      if (
        (await asset.fs.exists(entryPath)) &&
        (await asset.fs.exists(srcEntryPath))
      ) {
        vLog(`Adding tab ${entry}`)
        asset.addURLDependency(`tabs/${htmlEntry}`, {
          needsStableName: true
        })
      }
    })
  )
}
