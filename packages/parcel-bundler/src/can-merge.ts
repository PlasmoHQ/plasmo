export function canMerge(a, b) {
  // Bundles can be merged if they have the same type and environment,
  // unless they are explicitly marked as isolated or inline.
  return (
    a.type === b.type &&
    a.env.context === b.env.context &&
    a.bundleBehavior == null &&
    b.bundleBehavior == null
  )
}
