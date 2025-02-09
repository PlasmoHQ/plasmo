import { resolve } from "path"

import {
  resolveSourceIndex,
  state,
  type ResolverProps,
  type ResolverResult
} from "./shared"

const resolveByPrefix = (specifier = "", prefix = "", prefixPath = "") => {
  if (!specifier.startsWith(prefix)) {
    return null
  }

  const [_, specifierPath] = specifier.split(prefix)

  return resolveSourceIndex(resolve(prefixPath, specifierPath))
}

export async function handlePlasmoInternal({
  specifier
}: ResolverProps): Promise<ResolverResult> {
  return resolveByPrefix(
    specifier,
    "@plasmo-static-common/",
    resolve(state.dotPlasmoDirectory, "static", "common")
  )
}
