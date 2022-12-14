import { getFlagMap } from "~features/helpers/flag"

export const getBundleConfig = () => {
  const flagMap = getFlagMap()
  const { target, tag } = flagMap
  const [browser, manifestVersion] = target.split("-")
  const engines = {
    browsers:
      manifestVersion === "mv2" && browser !== "firefox"
        ? ["IE 11"]
        : ["last 1 Chrome version"]
  }

  // Potential runtime config here
  return {
    tag,
    target,
    browser,
    manifestVersion,
    engines
  }
}

export type PlasmoBundleConfig = ReturnType<typeof getBundleConfig>
