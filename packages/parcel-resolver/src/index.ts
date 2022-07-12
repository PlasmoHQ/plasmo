import { Resolver } from "@parcel/plugin"

import { remoteCaching } from "./remote-caching"
import { initializeState } from "./shared"
import { tildeSrc } from "./tilde-src"

export default new Resolver({
  async resolve(opts) {
    await initializeState(opts)

    const remoteCacheResult = await remoteCaching(opts)
    if (remoteCacheResult !== null) {
      return remoteCacheResult
    }

    const tildeSrcResult = await tildeSrc(opts)
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
