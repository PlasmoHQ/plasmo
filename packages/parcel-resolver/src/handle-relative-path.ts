import { resolve } from "path"

import {
  type ResolverProps,
  type ResolverResult,
  resolveSourceIndex
} from "./shared"

const ignoreDirectories = [".plasmo", "node_modules"]

export async function handleRelativePath({
  specifier,
  dependency
}: ResolverProps): Promise<ResolverResult> {
  if (ignoreDirectories.some((dir) => dependency?.resolveFrom?.includes(dir))) {
    return null
  }

  if (specifier.slice(0, 2) === "./" || specifier.slice(0, 3) === "../") {
    const absoluteBaseFile = resolve(dependency.resolveFrom, "../", specifier)
    return resolveSourceIndex(absoluteBaseFile, [".ts", ".tsx", ".js", ".jsx"])
  }

  return null
}
