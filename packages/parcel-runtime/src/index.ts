import { Runtime } from "@parcel/plugin"
import fs from "fs"
import path from "path"

import type { HmrData } from "./types"

const hmrRuntimeCode = fs.readFileSync(
  path.join(__dirname, "./hmr-runtime.js"),
  "utf8"
)

export default new Runtime({
  apply({ bundle, options }) {
    if (
      bundle.type !== "js" ||
      !options.hmrOptions ||
      bundle.env.isLibrary ||
      bundle.env.isWorklet() ||
      bundle.env.sourceType === "script"
    ) {
      return
    }

    const hmrData: HmrData = {
      host: options.hmrOptions.host,
      port: options.hmrOptions.port,
      secure: !!(options.serveOptions && options.serveOptions.https),
      bundleId: bundle.id,
      serverPort: options.serveOptions && options.serveOptions.port
    }

    return {
      filePath: __filename,
      code: hmrRuntimeCode.replace(
        `"__plasmo_hmr_data__"`, // double quote to escape
        JSON.stringify(hmrData)
      ),
      isEntry: true,
      env: {
        sourceType: "module"
      }
    }
  }
})
