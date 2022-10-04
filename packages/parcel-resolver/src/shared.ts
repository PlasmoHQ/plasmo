import type { Resolver } from "@parcel/plugin"
import type { Got } from "got"

export const relevantExtensionList = [
  ".ts",
  ".tsx",
  ".svelte",
  ".vue",
  ".json"
] as const

export const relevantExtensionSet = new Set(relevantExtensionList)

type ResolveFx = ConstructorParameters<typeof Resolver>[0]["resolve"]

export type ResolverResult = ReturnType<ResolveFx>

export type ResolverProps = Parameters<ResolveFx>[0]

export const state = {
  got: null as Got,
  srcDir: null as string
}

export const initializeState = async (props: ResolverProps) => {
  if (state.got === null) {
    state.got = (await import("got")).default
  }

  state.srcDir = process.env.PLASMO_SRC_DIR
}
