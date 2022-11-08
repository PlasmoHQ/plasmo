import { flagMap } from "~features/helpers/flag"

const { target, tag } = flagMap

export const [browser, manifestVersion] = target.split("-")

export const getBundleConfig = () => {
  // Potential runtime config here
  return {
    tag,
    target,
    browser,
    manifestVersion
  }
}

export type PlasmoBundleConfig = ReturnType<typeof getBundleConfig>
