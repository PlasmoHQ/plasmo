import { resolve } from "path"

import {
  type ResolverProps,
  type ResolverResult,
  resolveSourceIndex,
  state
} from "./shared"

export async function handleAlias({
  specifier
}: ResolverProps): Promise<ResolverResult> {
  const targetAlias = Array.from(state.aliasMap.keys()).find((alias) => {
    return specifier.includes(alias);
  })

  if (!targetAlias) {
    return null
  }

  const wipeAliasPath = specifier.replace(new RegExp(targetAlias, "g"), "")
  const absolutePath = resolve(
    process.env.PLASMO_PROJECT_DIR,
    state.aliasMap.get(targetAlias)[0],
    wipeAliasPath
  )

  return resolveSourceIndex(absolutePath, [".ts", ".tsx", ".js", ".jsx"])
}