import { hashString } from "@parcel/hash"
import { resolve } from "path"

import { injectEnv } from "@plasmo/utils/env"
import { vLog } from "@plasmo/utils/logging"

import {
  type ResolverProps,
  type ResolverResult,
  relevantExtensionList,
  state
} from "./shared"

const cookCode = async (target: URL, code: string) => {
  if (target.origin === "https://www.googletagmanager.com") {
    return code.replace(/http:/g, "chrome-extension:")
  } else {
    return code
  }
}

export async function handleRemoteCaching({
  specifier,
  dependency,
  options
}: ResolverProps): Promise<ResolverResult> {
  if (!specifier.startsWith("https://")) {
    return null
  }

  if (
    !relevantExtensionList.some((ext) => dependency.sourcePath.endsWith(ext))
  ) {
    return null
  }
  const target = new URL(injectEnv(specifier))

  const fileType = target.searchParams.get("plasmo-ext") || "js"

  try {
    const code = (await state.got(target.toString()).text()) as string

    const cookedCode = await cookCode(target, code)

    const filePath = resolve(
      state.remoteCacheDirectory,
      `${hashString(specifier)}-${hashString(cookedCode)}.${fileType}`
    )

    await options.inputFS.rimraf(filePath)

    await options.inputFS.writeFile(filePath, cookedCode, {
      mode: 0o66
    })

    vLog(`Caching HTTPS dependency: ${specifier}`)

    return {
      code: cookedCode,
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
