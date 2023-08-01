import { statSync } from "fs"
import { join, resolve } from "path"
import type { Resolver } from "@parcel/plugin"
import type { ResolveResult } from "@parcel/types"
import glob from "fast-glob"
import { readJson } from "fs-extra"
import type { Got } from "got"

import { vLog } from "@plasmo/utils/logging"
import { toPosix } from "@plasmo/utils/path"

export const relevantExtensionList = [
  ".ts",
  ".tsx",
  ".svelte",
  ".vue",
  ".json"
] as const

export const relevantExtensionSet = new Set(relevantExtensionList)

type ResolveFx = ConstructorParameters<typeof Resolver>[0]["resolve"]

export type ResolverResult = ResolveResult

export type ResolverProps = Parameters<ResolveFx>[0]

export const state = {
  got: null as Got,
  dotPlasmoDirectory: null as string,
  remoteCacheDirectory: null as string,
  polyfillMap: null as Map<string, string>,
  aliasMap: null as Map<string, string>
}

export const initializeState = async (props: ResolverProps) => {
  if (state.got === null) {
    state.got = (await import("got")).default
  }
  if (!state.dotPlasmoDirectory) {
    state.dotPlasmoDirectory = resolve(
      process.env.PLASMO_PROJECT_DIR,
      ".plasmo"
    )
  }
  if (!state.remoteCacheDirectory) {
    state.remoteCacheDirectory = resolve(
      state.dotPlasmoDirectory,
      "cache",
      "remote-code"
    )

    if (!(await props.options.inputFS.exists(state.remoteCacheDirectory))) {
      vLog("Reinitializing remote cache directory")
      await props.options.inputFS.mkdirp(state.remoteCacheDirectory)
    }
  }

  if (!state.polyfillMap) {
    const polyfillsDirectory = join(__dirname, "polyfills")

    const polyfillHandlers = await glob("**/*.js", {
      cwd: polyfillsDirectory,
      onlyFiles: true
    })

    state.polyfillMap = new Map(
      polyfillHandlers.map((handler) => [
        toPosix(handler.slice(0, -3)),
        join(polyfillsDirectory, handler)
      ])
    )
  }

  if (!state.aliasMap) {
    const packageJson = await readJson(
      resolve(process.env.PLASMO_PROJECT_DIR, "package.json")
    )

    state.aliasMap = new Map(Object.entries(packageJson.alias || {}))
  }
}

/**
 * Look for source code file (crawl index)
 */
export const resolveSourceIndex = async (
  absoluteBaseFile: string,
  checkingExts = relevantExtensionList as readonly string[],
  opts = {} as Partial<ResolveResult>
): Promise<ResolverResult> => {
  const potentialFiles = checkingExts.flatMap((ext) => [
    `${absoluteBaseFile}${ext}`,
    resolve(absoluteBaseFile, `index${ext}`)
  ])

  for (const file of potentialFiles) {
    try {
      if (statSync(file).isFile()) {
        return { filePath: file, ...opts }
      }
    } catch {}
  }

  return null
}
