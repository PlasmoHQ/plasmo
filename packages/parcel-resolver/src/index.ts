import { Resolver } from "@parcel/plugin"

import { handleAbsoluteRoot } from "./handle-absolute-root"
import { handleAlias } from "./handle-alias"
import { handleModuleExport } from "./handle-module-exports"
import { handlePlasmoInternal } from "./handle-plasmo-internal"
import { handlePolyfill } from "./handle-polyfill"
import { handleRemoteCaching } from "./handle-remote-caching"
import { handleTildeSrc } from "./handle-tilde-src"
import { initializeState, state } from "./shared"

export default new Resolver({
  async resolve(props) {
    await initializeState(props)

    return (
      (await handleAlias(props)) ||
      (await handlePlasmoInternal(props)) ||
      (await handlePolyfill(props)) ||
      (await handleRemoteCaching(props)) ||
      (await handleTildeSrc(props)) ||
      (await handleAbsoluteRoot(props)) ||
      (await handleModuleExport(props)) ||
      null
    )
  }
})
