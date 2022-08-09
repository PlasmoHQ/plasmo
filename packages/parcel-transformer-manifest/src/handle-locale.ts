import ThrowableDiagnostic, {
  getJSONSourceLocation,
  md
} from "@parcel/diagnostic"
import path from "path"

import { state } from "./state"

export async function handleLocale() {
  const { program, ptrs, asset, assetDir, filePath } = state

  if (!program.default_locale) {
    return
  }

  const locales = path.join(assetDir, "_locales")
  const err = !(await asset.fs.exists(locales))
    ? "key"
    : !(await asset.fs.exists(
        path.join(locales, program.default_locale, "messages.json")
      ))
    ? "value"
    : null

  if (err) {
    throw new ThrowableDiagnostic({
      diagnostic: [
        {
          message: "Invalid Web Extension manifest",
          origin: "@plasmohq/parcel-transformer-manifest",
          codeFrames: [
            {
              filePath,
              codeHighlights: [
                {
                  ...getJSONSourceLocation(ptrs["/default_locale"], err),
                  message: md([
                    `Localization ${
                      err === "value"
                        ? "file for " + program.default_locale
                        : "directory"
                    } does not exist: ${path.relative(
                      assetDir,
                      path.join(locales, program.default_locale)
                    )}`
                  ])
                }
              ]
            }
          ]
        }
      ]
    })
  }

  for (const locale of await asset.fs.readdir(locales)) {
    if (await asset.fs.exists(path.join(locales, locale, "messages.json"))) {
      asset.addURLDependency(`_locales/${locale}/messages.json`, {
        needsStableName: true,
        pipeline: "raw"
      })
    }
  }
}
