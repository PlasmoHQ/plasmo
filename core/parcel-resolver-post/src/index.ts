import { Resolver } from "@parcel/plugin"

import { handleHacks } from "./handle-hacks"
import { handleModuleExport } from "./handle-module-exports"
import { handleTsPath } from "./handle-ts-path"

export default new Resolver({
  async resolve(props) {
    const { specifier } = props;

    if (specifier.startsWith("node:")) {
      // Tells Parcel not to try bundling it at all
      return {
        isExcluded: true
      }
    }

    // Otherwise, do your custom logic
    return (
      (await handleHacks(props)) ||
      (await handleTsPath(props)) ||
      (await handleModuleExport(props)) ||
      null
    )
  }
})
