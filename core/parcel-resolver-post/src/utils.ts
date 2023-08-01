import { statSync } from "fs"
import { resolve } from "path"
import type { ResolveResult } from "@parcel/types"

import { relevantExtensionList, type ResolverResult } from "./shared"

const WEBPACK_IMPORT_REGEX = /\S+-loader\S*!\S+/g

export function checkWebpackSpecificImportSyntax(specifier = "") {
  // Throw user friendly errors on special webpack loader syntax
  // ex. `imports-loader?$=jquery!./example.js`
  if (WEBPACK_IMPORT_REGEX.test(specifier)) {
    throw new Error(
      `The import path: ${specifier} is using webpack specific loader import syntax, which isn't supported by Parcel.`
    )
  }
}

export function trimStar(str: string) {
  return trim(str, "*")
}

export function trim(str: string, trim: string) {
  if (str.endsWith(trim)) {
    str = str.substring(0, str.length - trim.length)
  }
  return str
}

const isFile = (filePath: string) => {
  try {
    return statSync(filePath).isFile()
  } catch {
    return false
  }
}

export function findModule(
  absoluteBaseFile: string,
  checkingExts = relevantExtensionList as readonly string[]
) {
  return checkingExts
    .flatMap((ext) => [
      resolve(`${absoluteBaseFile}${ext}`),
      resolve(absoluteBaseFile, `index${ext}`)
    ])
    .find(isFile)
}

/**
 * Look for source code file (crawl index)
 */
export const resolveSourceIndex = async (
  absoluteBaseFile: string,
  checkingExts = relevantExtensionList as readonly string[],
  opts = {} as Partial<ResolveResult>
): Promise<ResolverResult> => {
  const filePath = findModule(absoluteBaseFile, checkingExts)

  if (!filePath) {
    return null
  }

  return { filePath, ...opts }
}
