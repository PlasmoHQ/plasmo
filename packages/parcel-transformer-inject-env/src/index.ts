import { Transformer } from "@parcel/plugin"

const envRegex = /\$(PLASMO_PUBLIC_[\w+]+)/gm

export default new Transformer({
  async transform({ asset, options }) {
    const code = await asset.getCode()

    const injectedCode = code.replace(
      envRegex,
      (match, g1) => options.env[g1] || match
    )

    asset.setCode(injectedCode)

    return [asset]
  }
})
