import type { ResolverProps, ResolverResult } from "./shared"

// TODO: move this stuff into plasmo.config.ts
const knownEsmPackageSet = new Set(["firebase-admin", "svelte", "ai"])

// Last resort resolver for weird packages:
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
      const filePath = require.resolve(specifier, {
        paths: [dependency.resolveFrom]
      })

      return {
        filePath
      }
    }
  } catch {}

  return null
}
