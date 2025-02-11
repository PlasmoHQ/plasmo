import type { ResolverProps, ResolverResult } from "./shared"

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
    const filePath = require.resolve(specifier, {
      paths: [dependency.resolveFrom]
    })

    return {
      filePath
    }
  } catch {}

  return null
}
