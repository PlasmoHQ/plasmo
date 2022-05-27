import { hashString } from "@parcel/hash"
import { Resolver } from "@parcel/plugin"
import type { Got } from "got"
import { resolve } from "path"

let got: Got

const relevantExtension = [".ts", ".tsx"]

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

    const filePath = resolve(
      options.projectRoot,
      `${hashString(specifier)}.${fileType}`
    )

    try {
      const code = await got(target.toString()).text()

      return {
        filePath,
        code,
        priority: "sync"
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
