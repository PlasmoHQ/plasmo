import { Resolver } from "@parcel/plugin"

import { handleHacks } from "./handle-hacks"
import { handleModuleExport } from "./handle-module-exports"
import { handleTsPath } from "./handle-ts-path"

export default new Resolver({
  async resolve(props) {
    return (
      (await handleTsPath(props)) ||
      (await handleModuleExport(props)) ||
      (await handleHacks(props)) ||
      null
    )
  }
})
