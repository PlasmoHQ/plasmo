import { Resolver } from "@parcel/plugin"

import { handleRemoteCaching } from "./handle-remote-caching"
import { handleTildeSrc } from "./handle-tilde-src"
import { initializeState } from "./shared"

export default new Resolver({
  async resolve(opts) {
    await initializeState(opts)

    const remoteCacheResult = await handleRemoteCaching(opts)
    if (remoteCacheResult !== null) {
      return remoteCacheResult
    }

    const tildeSrcResult = await handleTildeSrc(opts)
    if (tildeSrcResult !== null) {
      return tildeSrcResult
    }

    try {
      const segments = opts.specifier.split("/")

      if (segments.length > 2) {
        const filePath = require.resolve(opts.specifier, {
          paths: [opts.dependency.resolveFrom]
        })

        return {
          filePath
        }
      }
    } catch {}

    return null
  }
})
