import { statSync } from "fs"
import { extname, resolve } from "path"

import {
  ResolverOptions,
  ResolverResult,
  relevantExtensionList,
  relevantExtensionSet,
  state
} from "./shared"

export async function handleTildeSrc({
  specifier,
  dependency
}: ResolverOptions): Promise<ResolverResult> {
  if (specifier[0] !== "~") {
    return null
  }

  const absoluteBaseFile = resolve(state.srcDir, specifier.slice(1))

  const importExt = extname(absoluteBaseFile)

  if (importExt.length > 0 && relevantExtensionSet.has(importExt as any)) {
    return {
      filePath: absoluteBaseFile
    }
  }

  const parentExt = extname(dependency.resolveFrom)

  // console.log(`tildeSrc: resolveFrom: ${dependency.resolveFrom}`)

  const checkingExts = [
    parentExt,
    ...relevantExtensionList.filter((ext) => ext !== parentExt)
  ]

  const potentialFiles = checkingExts.flatMap((ext) => [
    `${absoluteBaseFile}${ext}`,
    resolve(absoluteBaseFile, `index${ext}`)
  ])

  // console.log(`tildeSrc: ${potentialFiles}`)

  for (const file of potentialFiles) {
    try {
      if (statSync(file).isFile()) {
        return { filePath: file }
      }
    } catch {}
  }

  return null
}
