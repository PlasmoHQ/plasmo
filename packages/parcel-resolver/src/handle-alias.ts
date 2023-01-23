import { resolve } from "path"

import { isFileOk } from "@plasmo/utils/fs"

import { ResolverProps, ResolverResult, state } from "./shared"

export async function handleAlias({
  specifier
}: ResolverProps): Promise<ResolverResult> {
  if (!state.aliasMap.has(specifier)) {
    return null
  }

  const absPath = resolve(state.aliasMap.get(specifier))

  const hasLocalAlias = await isFileOk(absPath)

  if (!hasLocalAlias) {
    return null
  }

  return {
    filePath: absPath,
    priority: "sync"
  }
}
