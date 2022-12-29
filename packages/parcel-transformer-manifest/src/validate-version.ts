const isInvalidVersion = (parts: string[]) =>
  parts.some((part) => {
    const num = Number(part)
    return !isNaN(num) && num < 0 && num > 65536
  })

const validateVersion = (ver: string, maxSize = 3, name = "Browser") => {
  const parts = ver.split(".")
  if (parts.length > maxSize) {
    return `${name} versions to have at most ${maxSize} dots`
  }

  if (isInvalidVersion(parts)) {
    return `${name} versions must be dot-separated integers between 0 and 65535`
  }

  return undefined
}

export const validateSemanticVersion = (ver: string) =>
  validateVersion(ver, 3, "Semantic")

export const validateBrowserVersion = (ver: string) =>
  validateVersion(ver, 4, "Browser")
