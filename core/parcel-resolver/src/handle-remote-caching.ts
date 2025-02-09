import { resolve } from "path"
import { hashString } from "@parcel/hash"

import { injectEnv } from "@plasmo/utils/env"
import { vLog } from "@plasmo/utils/logging"

import {
  relevantExtensionList,
  state,
  type ResolverProps,
  type ResolverResult
} from "./shared"

const cookCode = async (target: URL, code: string) => {
  if (target.origin === "https://www.googletagmanager.com") {
    return code.replace(/http:/g, "chrome-extension:")
  } else {
    return code
  }
}

// TODO: Some kind of caching mechanism would be nice
export async function handleRemoteCaching({
  specifier,
  dependency,
  options
}: ResolverProps): Promise<ResolverResult> {
  if (!specifier.startsWith("https://")) {
    return null
  }

  // Only these extensions parents are allowed to cache remote dependencies
  if (
    !relevantExtensionList.some((ext) => dependency.sourcePath.endsWith(ext))
  ) {
    return null
  }
  const target = new URL(injectEnv(specifier))

  const fileType = target.searchParams.get("plasmo-ext") || "js"

  try {
    const filePath = resolve(
      state.remoteCacheDirectory,
      `${hashString(specifier)}.${fileType}`
    )
    const code = (await state.got(target.toString()).text()) as string

    const cookedCode = await cookCode(target, code)

    await options.inputFS.rimraf(filePath)

    await options.inputFS.writeFile(filePath, cookedCode, {
      mode: 0o664
    })

    vLog(`Caching HTTPS dependency: ${specifier}`)

    return {
      priority: "lazy",
      sideEffects: true,
      filePath
    }
  } catch (error) {
    return {
      diagnostics: [
        {
          message: `Cannot download the resource from ${specifier}`,
          hints: [error.message]
        }
      ]
    }
  }
}
