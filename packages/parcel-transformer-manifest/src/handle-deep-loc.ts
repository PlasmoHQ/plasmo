import { getJSONSourceLocation } from "@parcel/diagnostic"
import { extname } from "path"

import { state } from "./state"

const DEEP_LOCS = [
  ["icons"],
  ["browser_action", "default_icon"],
  ["browser_action", "default_popup"],
  ["page_action", "default_icon"],
  ["page_action", "default_popup"],
  ["action", "default_icon"],
  ["action", "default_popup"],
  ["background", "scripts"],
  ["chrome_url_overrides"],
  ["devtools_page"],
  ["options_ui", "page"],
  ["sandbox", "pages"],
  ["sidebar_action", "default_icon"],
  ["sidebar_action", "default_panel"],
  ["storage", "managed_schema"],
  ["theme", "images", "theme_frame"],
  ["theme", "images", "additional_backgrounds"],
  ["user_scripts", "api_script"]
] as const

export const handleDeepLOC = () => {
  const { program, filePath, ptrs, asset } = state

  const relevantLocs = DEEP_LOCS.map(
    (loc) => [loc, "/" + loc.join("/")] as const
  ).filter(([_, location]) => !!ptrs[location])

  for (const [loc, location] of relevantLocs) {
    let programPtr: any = program

    for (let i = 0; i < loc.length - 1; ++i) {
      programPtr = programPtr[loc[i]]
    }

    const lastLoc = loc[loc.length - 1]
    const obj = programPtr[lastLoc]

    if (typeof obj == "string")
      programPtr[lastLoc] = asset.addURLDependency(obj, {
        bundleBehavior: "isolated",
        loc: {
          filePath,
          ...getJSONSourceLocation(ptrs[location], "value")
        },
        pipeline: extname(obj) === ".json" ? "raw" : undefined
      })
    else {
      for (const k of Object.keys(obj)) {
        obj[k] = asset.addURLDependency(obj[k], {
          bundleBehavior: "isolated",
          loc: {
            filePath,
            ...getJSONSourceLocation(ptrs[location + "/" + k], "value")
          },
          pipeline: extname(obj[k]) === ".json" ? "raw" : undefined
        })
      }
    }
  }
}
