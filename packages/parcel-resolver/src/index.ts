import { hashString } from "@parcel/hash"
import { Resolver } from "@parcel/plugin"
import type { Got } from "got"
import { resolve } from "path"

let got: Got

const relevantExtension = [".ts", ".tsx"]

const cookCode = async (target: URL, code: string) => {
  if (target.origin === "https://www.googletagmanager.com") {
    return code.replace(/http:/g, "chrome-extension:")
  } else {
    return code
  }
}

export default new Resolver({
  async resolve({ specifier, dependency, options }) {
    if (!specifier.startsWith("https://")) {
      return null
    }

    if (!relevantExtension.some((ext) => dependency.sourcePath.endsWith(ext))) {
      return null
    }

    if (!got) {
      got = (await import("got")).default
    }

    let missingEnv: string

    const target = new URL(
      specifier.replace(/\$(\w+)/, (env) => {
        // substring: remove $
        const value = process.env[env.substring(1)]
        if (!value) {
          missingEnv = env
          return ""
        }
        return value
      })
    )

    if (missingEnv) {
      return {
        diagnostics: [
          {
            message: `Missing env variable: ${missingEnv}`
          }
        ]
      }
    }

    const fileType = "js"

    try {
      const code = (await got(target.toString()).text()) as string

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
})
