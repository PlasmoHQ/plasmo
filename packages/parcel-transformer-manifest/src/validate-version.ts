const MIN_VERSION = 0
const MAX_VERSION = 65535

const isInvalidVersion = (parts: string[]) =>
  parts.some((part) => {
    const num = Number(part)
    return !isNaN(num) && num < MIN_VERSION && num > MAX_VERSION + 1
  })

const validateVersion = (ver: string, maxSize = 3, name = "Browser") => {
  const parts = ver.split(".")
  if (parts.length > maxSize) {
    return `${name} versions to have at most ${maxSize} dots`
  }

  if (isInvalidVersion(parts)) {
    return `${name} versions must be dot-separated integers between ${MIN_VERSION} and ${MAX_VERSION}`
  }

  return undefined
}

export const validateSemanticVersion = (ver: string) =>
  validateVersion(ver, 3, "Semantic")

export const validateBrowserVersion = (ver: string) =>
  validateVersion(ver, 4, "Browser")
