import { paramCase } from "change-case"

import { getFlag } from "@plasmo/utils"

export const getBundleConfig = () => {
  const target = paramCase(getFlag("--target") || "chrome-mv3")

  const [browser, manifestVersion] = target.split("-")

  const engines = {
    browsers:
      manifestVersion === "mv2" && browser !== "firefox"
        ? ["IE 11"]
        : ["last 1 Chrome version"]
  }

  return {
    target,
    browser,
    manifestVersion,
    engines
  }
}

export type PlasmoBundleConfig = ReturnType<typeof getBundleConfig>
