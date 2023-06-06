import { Resolver } from "@parcel/plugin"

import { handleModuleExport } from "./handle-module-exports"
import { handleTsPath } from "./handle-ts-path"

export default new Resolver({
  async resolve(props) {
    return (
      (await handleTsPath(props)) || (await handleModuleExport(props)) || null
    )
  }
})
