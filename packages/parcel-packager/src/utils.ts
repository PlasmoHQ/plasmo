import type { NamedBundle } from "@parcel/types"
import { relativeBundlePath } from "@parcel/utils"

export function getRelativePath(from: NamedBundle, to: NamedBundle): string {
  return relativeBundlePath(from, to, {
    leadingDotSlash: false
  })
}
