import { extname } from "path"
import { getJSONSourceLocation } from "@parcel/diagnostic"

import { vLog } from "@plasmo/utils/logging"

import { getState } from "./state"

const DEEP_LOCS = [
  ["icons"],
  ["browser_action", "default_icon"],
  ["browser_action", "default_popup"],
  ["page_action", "default_icon"],
  ["page_action", "default_popup"],
  ["action", "default_icon"],
  ["action", "default_popup"],
  ["chrome_url_overrides"],
  ["devtools_page"],
  ["options_ui", "page"],
  ["sidebar_action", "default_icon"],
  ["sidebar_action", "default_panel"],
  ["side_panel", "default_path"],
  ["storage", "managed_schema"],
  ["theme", "images", "theme_frame"],
  ["theme", "images", "additional_backgrounds"],
  ["user_scripts", "api_script"]
]

export const handleDeepLOC = () => {
  const { program, filePath, ptrs, asset } = getState()
  const relevantLocs = DEEP_LOCS.map(
    (loc) => [loc, "/" + loc.join("/")] as const
  ).filter(([_, location]) => !!ptrs[location])

  for (const [loc, location] of relevantLocs) {
    const lastIndex = loc.length - 1
    const lastLoc = loc[lastIndex]

    // Reduce it right before the last loc
    const programPtr = loc.reduce(
      (acc, key, index) => (index === lastIndex ? acc : acc[key]),
      program
    )

    const obj = programPtr[lastLoc]

    vLog(`Adding ${lastLoc}`)

    if (typeof obj === "string") {
      const ext = extname(obj)
      programPtr[lastLoc] = asset.addURLDependency(obj, {
        bundleBehavior: "isolated",
        loc: {
          filePath,
          ...getJSONSourceLocation(ptrs[location], "value")
        },
        needsStableName: ext === ".html",
        pipeline: ext === ".json" ? "raw-env" : undefined
      })
    } else {
      for (const k of Object.keys(obj)) {
        const ext = extname(obj[k])
        obj[k] = asset.addURLDependency(obj[k], {
          bundleBehavior: "isolated",
          loc: {
            filePath,
            ...getJSONSourceLocation(ptrs[location + "/" + k], "value")
          },
          needsStableName: ext === ".html",
          pipeline: ext === ".json" ? "raw-env" : undefined
        })
      }
    }
  }
}
