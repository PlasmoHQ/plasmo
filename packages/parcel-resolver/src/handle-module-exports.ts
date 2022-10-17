import type { ResolverProps, ResolverResult } from "./shared"

export async function handleModuleExport({
  specifier,
  dependency
}: ResolverProps): Promise<ResolverResult> {
  try {
    const segments = specifier.split("/")

    if (segments.length > 2) {
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
