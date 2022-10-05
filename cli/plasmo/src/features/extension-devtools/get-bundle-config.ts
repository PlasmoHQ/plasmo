import { paramCase } from "change-case"

import { getFlag } from "@plasmo/utils"

export const getBundleConfig = () => {
  const target = paramCase(getFlag("--target") || "chrome-mv3")

  const [browser, manifestVersion] = target.split("-")

  return {
    target,
    browser,
    manifestVersion
  }
}

export type PlasmoBundleConfig = ReturnType<typeof getBundleConfig>
