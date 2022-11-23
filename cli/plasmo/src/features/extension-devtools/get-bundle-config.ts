import { getFlagMap } from "~features/helpers/flag"

export const getBundleConfig = () => {
  const flagMap = getFlagMap()
  const { target, tag } = flagMap
  const [browser, manifestVersion] = target.split("-")
  // Potential runtime config here
  return {
    tag,
    target,
    browser,
    manifestVersion
  }
}

export type PlasmoBundleConfig = ReturnType<typeof getBundleConfig>
