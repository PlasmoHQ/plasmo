import { Resolver } from "@parcel/plugin"

import { handleTsPath } from "./handle-ts-path"

export default new Resolver({
  async resolve(props) {
    return (await handleTsPath(props)) || null
  }
})
