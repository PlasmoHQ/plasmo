import { iLog } from "@plasmo/utils/logging"

const defaultTransformer = (target: any) =>
  iLog({
    target
  })

/**
 * Traverse a target object and apply a transformer function to each value.
 * Retains only defined values.
 */
export const definedTraverse = (
  target: any,
  transformer = defaultTransformer
): any => {
  if (Array.isArray(target)) {
    return target
      .map((item) => definedTraverse(item, transformer))
      .filter((i) => i !== undefined)
  } else if (typeof target === "object") {
    const result = {} as any

    for (const key in target) {
      if (target.hasOwnProperty(key)) {
        result[key] = definedTraverse(target[key], transformer)
        if (result[key] === undefined) {
          delete result[key]
        }
      }
    }

    return result
  } else {
    return transformer(target)
  }
}
