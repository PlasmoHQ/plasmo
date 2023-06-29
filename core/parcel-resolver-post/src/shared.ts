import type { Resolver } from "@parcel/plugin"
import type { ResolveResult } from "@parcel/types"

export const relevantExtensionList = [
  ".ts",
  ".tsx",
  ".svelte",
  ".vue",
  ".json",

  ".js",
  ".jsx"
] as const

export const relevantExtensionSet = new Set(relevantExtensionList)

type ResolveFx = ConstructorParameters<typeof Resolver>[0]["resolve"]

export type ResolverResult = ResolveResult
export type ResolverProps = Parameters<ResolveFx>[0]
