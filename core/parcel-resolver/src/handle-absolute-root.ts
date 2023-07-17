import { extname, isAbsolute, resolve } from "path"

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
  if (specifier[0] !== "/" || isAbsolute(specifier)) {
    return null
  }

  const absoluteBaseFile = resolve(
    process.env.PLASMO_PROJECT_DIR,
    specifier.slice(1)
  )

  const importExt = extname(absoluteBaseFile)

  if (importExt.length > 0) {
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
