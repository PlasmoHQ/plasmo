import { Transformer } from "@parcel/plugin"

import { injectEnv } from "@plasmo/utils/env"

export default new Transformer({
  async transform({ asset, options }) {
    const code = await asset.getCode()

    const injectedCode = injectEnv(code, options.env)

    asset.setCode(injectedCode)

    return [asset]
  }
})
