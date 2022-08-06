import { getJSONSourceLocation } from "@parcel/diagnostic"

import { checkMV2, state } from "./state"

export async function handleAction() {
  const { program, filePath, ptrs, asset } = state

  const isMV2 = checkMV2(program)

  const browserActionName = isMV2 ? "browser_action" : "action"

  const browserAction = isMV2 ? program.browser_action : program.action

  if (!browserAction) {
    return
  }

  if (browserAction.theme_icons) {
    browserAction.theme_icons = browserAction.theme_icons.map(
      (themeIcon, themeIndex) => {
        for (const k of ["light", "dark"]) {
          const loc = getJSONSourceLocation(
            ptrs[`/${browserActionName}/theme_icons/${themeIndex}/${k}`],
            "value"
          )

          themeIcon[k] = asset.addURLDependency(themeIcon[k], {
            loc: {
              ...loc,
              filePath
            }
          })
        }

        return themeIcon
      }
    )
  }
}
