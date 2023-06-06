import type { ResolverProps, ResolverResult } from "./shared"

const knownEsmPackageSet = new Set(["firebase-admin"])

export async function handleModuleExport({
  specifier,
  dependency
}: ResolverProps): Promise<ResolverResult> {
  // Ignore relative path
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    return null
  }

  try {
    const segments = specifier.split("/")

    if (segments.length > 2 || knownEsmPackageSet.has(segments[0])) {
      console.log(segments)

      const filePath = require.resolve(specifier, {
        paths: [dependency.resolveFrom]
      })

      console.log(filePath)

      return {
        filePath
      }
    }
  } catch {}

  return null
}
