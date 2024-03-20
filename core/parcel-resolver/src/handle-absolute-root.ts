import { extname, isAbsolute, join, resolve } from "path"
import { pathExists, pathExistsSync } from "fs-extra"

import {
  relevantExtensionList,
  resolveSourceIndex,
  type ResolverProps,
  type ResolverResult
} from "./shared"

export async function handleAbsoluteRoot({
  specifier,
  dependency
}: ResolverProps): Promise<ResolverResult> {
  if (specifier[0] !== "/") {
    return null
  }

  if (pathExistsSync(specifier)) {
    return {
      filePath: specifier
    }
  }

  const absoluteBaseFile = resolve(
    join(process.env.PLASMO_PROJECT_DIR, specifier.slice(1))
  )

  const importExt = extname(absoluteBaseFile)

  if (importExt.length > 0 && pathExistsSync(absoluteBaseFile)) {
    return {
      filePath: absoluteBaseFile
    }
  }

  const parentExt = extname(dependency.resolveFrom)

  const checkingExts = [
    parentExt,
    ...relevantExtensionList.filter((ext) => ext !== parentExt)
  ]

  return resolveSourceIndex(absoluteBaseFile, checkingExts)
}
