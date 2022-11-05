import { flagMap } from "~features/helpers/flag"

export const getBundleConfig = () => {
  const target = flagMap.target

  const [browser, manifestVersion] = target.split("-")

  const tag = flagMap.tag

  return {
    tag,
    target,
    browser,
    manifestVersion
  }
}

export type PlasmoBundleConfig = ReturnType<typeof getBundleConfig>
