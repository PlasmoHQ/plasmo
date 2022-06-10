import { hashString } from "@parcel/hash"
import { resolve } from "path"

import {
  ResolverOptions,
  ResolverResult,
  relevantExtension,
  state
} from "./shared"

const cookCode = async (target: URL, code: string) => {
  if (target.origin === "https://www.googletagmanager.com") {
    return code.replace(/http:/g, "chrome-extension:")
  } else {
    return code
  }
}

export async function remoteCaching({
  specifier,
  dependency,
  options
}: ResolverOptions): Promise<ResolverResult> {
  if (!specifier.startsWith("https://")) {
    return null
  }

  if (!relevantExtension.some((ext) => dependency.sourcePath.endsWith(ext))) {
    return null
  }

  const target = new URL(
    specifier.replace(
      /\$(\w+)/gm,
      (envKey) => process.env[envKey.substring(1)] || envKey
    )
  )

  const fileType = "js"

  try {
    const code = (await state.got(target.toString()).text()) as string

    const cookedCode = await cookCode(target, code)

    const filePath = resolve(
      options.projectRoot,
      `${hashString(specifier)}-${hashString(cookedCode)}.${fileType}`
    )

    return {
      code: cookedCode,
      priority: "lazy",
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
