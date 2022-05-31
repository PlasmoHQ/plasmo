import type { Resolver } from "@parcel/plugin"
import { existsSync } from "fs"
import type { Got } from "got"
import { resolve } from "path"

export const relevantExtension = [".ts", ".tsx", ".json"]

type ResolveFx = ConstructorParameters<typeof Resolver>[0]["resolve"]

export type ResolverResult = ReturnType<ResolveFx>

export type ResolverOptions = Parameters<ResolveFx>[0]

export const state = {
  got: null as Got,
  hasSrc: null as boolean,
  srcDir: null as string
}

export const initializeState = async (opts: ResolverOptions) => {
  if (state.got === null) {
    state.got = (await import("got")).default
  }

  if (state.hasSrc === null) {
    state.srcDir = resolve(opts.options.cacheDir, "..", "..", "..", "src")
    state.hasSrc = existsSync(state.srcDir)
  }
}
