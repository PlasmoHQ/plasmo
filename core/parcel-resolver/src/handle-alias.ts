import { resolve } from "path"

import { isReadable } from "@plasmo/utils/fs"

import { state, type ResolverProps, type ResolverResult } from "./shared"

export async function handleAlias({
  specifier
}: ResolverProps): Promise<ResolverResult> {
  if (!state.aliasMap.has(specifier)) {
    return null
  }

  const absPath = resolve(state.aliasMap.get(specifier))

  const hasLocalAlias = await isReadable(absPath)

  if (!hasLocalAlias) {
    return null
  }

  return {
    filePath: absPath,
    priority: "sync"
  }
}
