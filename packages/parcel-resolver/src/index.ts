import { Resolver } from "@parcel/plugin"

import { handleRemoteCaching } from "./handle-remote-caching"
import { handleTildeSrc } from "./handle-tilde-src"
import { initializeState } from "./shared"

export default new Resolver({
  async resolve(props) {
    await initializeState(props)

    const remoteCacheResult = await handleRemoteCaching(props)
    if (remoteCacheResult !== null) {
      return remoteCacheResult
    }

    const tildeSrcResult = await handleTildeSrc(props)
    if (tildeSrcResult !== null) {
      return tildeSrcResult
    }

    try {
      const segments = props.specifier.split("/")

      if (segments.length > 2) {
        const filePath = require.resolve(props.specifier, {
          paths: [props.dependency.resolveFrom]
        })

        return {
          filePath
        }
      }
    } catch {}

    return null
  }
})
