import { resolve } from "path"

import { vLog } from "@plasmo/utils/logging"

import { getState } from "./state"

export async function handleSandboxes() {
  const { asset, srcDir, dotPlasmoDir, program, env } = getState()

  // firefox does not support sandbox
  if (env.PLASMO_BROWSER === "firefox" || env.PLASMO_BROWSER === "gecko") {
    return
  }

  const srcPaths = ["sandboxes", "sandbox.ts", "sandbox.tsx", "sandbox.svelte"].map((file) =>
    resolve(srcDir, file)
  )

  const dotSandboxesDir = resolve(dotPlasmoDir, "sandboxes")

  const [
    srcSandboxesDirExists,
    srcSandboxTsFileExists,
    srcSandboxTsxFileExists,
    dotSandboxesDirExists
  ] = await Promise.all(
    [...srcPaths, dotSandboxesDir].map((p) => asset.fs.exists(p))
  )

  const [srcSandboxesDir] = srcPaths

  const sandboxPages = []

  if (srcSandboxesDirExists && dotSandboxesDirExists) {
    const sandboxEntries = await asset.fs.readdir(srcSandboxesDir)

    if (sandboxEntries.length > 0) {
      sandboxEntries.forEach((entry) => {
        const token = entry.split(".")
        token.pop()
        sandboxPages.push([entry, `${token.join(".")}.html`])
      })
    }
  }

  const hasSandboxFile = srcSandboxTsFileExists || srcSandboxTsxFileExists
  if (!hasSandboxFile && sandboxPages.length === 0) {
    return
  }

  if (!program.sandbox) {
    program.sandbox = {}
  }

  if (!program.sandbox.pages) {
    program.sandbox.pages = []
  }

  if (hasSandboxFile) {
    program.sandbox.pages.push(
      asset.addURLDependency("sandbox.html", {
        needsStableName: true
      })
    )
  }

  await Promise.all(
    sandboxPages.map(async ([entry, htmlEntry]) => {
      const srcEntryPath = resolve(srcSandboxesDir, entry)
      const entryPath = resolve(dotSandboxesDir, htmlEntry)
      if (
        (await asset.fs.exists(srcEntryPath)) &&
        (await asset.fs.exists(entryPath))
      ) {
        vLog(`Adding sandbox page: ${entry}`)
        program.sandbox.pages.push(
          asset.addURLDependency(`sandboxes/${htmlEntry}`, {
            needsStableName: true
          })
        )
      }
    })
  )
}
