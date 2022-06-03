import { statSync } from "fs"
import { extname, resolve } from "path"

import {
  ResolverOptions,
  ResolverResult,
  relevantExtension,
  state
} from "./shared"

export async function tildeSrc({
  specifier,
  dependency
}: ResolverOptions): Promise<ResolverResult> {
  if (!state.hasSrc) {
    return null
  }

  if (specifier[0] === "~") {
    const absoluteBaseFile = resolve(state.srcDir, specifier.slice(1))

    const parentExt = extname(dependency.resolveFrom)
    const checkingExts = [
      parentExt,
      ...relevantExtension.filter((ext) => ext !== parentExt)
    ]

    const potentialFiles = checkingExts.flatMap((ext) => [
      `${absoluteBaseFile}${ext}`,
      resolve(absoluteBaseFile, `index${ext}`)
    ])

    for (const file of potentialFiles) {
      try {
        if (statSync(file).isFile()) {
          return { filePath: file }
        }
      } catch (err) {
        // ignore
      }
    }
  }

  return null
}
