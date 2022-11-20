import { readFileSync, readdirSync } from "fs"
import { join } from "path"

import type { ResolverProps, ResolverResult } from "./shared"

const availablePolyfills = new Set(
  readdirSync(join(__dirname, "polyfills")).map((f) => f.slice(0, -3))
)

export async function handlePolyfill({
  specifier
}: ResolverProps): Promise<ResolverResult> {
  if (!availablePolyfills.has(specifier)) {
    return null
  }

  return {
    filePath: join(__dirname, "polyfills", `${specifier}.js`)
  }
}
