import { state, type ResolverProps, type ResolverResult } from "./shared"

export async function handlePolyfill({
  specifier
}: ResolverProps): Promise<ResolverResult> {
  if (!state.polyfillMap.has(specifier)) {
    return null
  }

  return {
    filePath: state.polyfillMap.get(specifier),
    priority: "sync"
  }
}
