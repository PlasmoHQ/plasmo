import { transform } from "@parcel/css"
import { Transformer } from "@parcel/plugin"
import { remapSourceLocation } from "@parcel/utils"
import { relative } from "path"

export default new Transformer({
  async transform({ asset, options }) {
    // Normalize the asset's environment so that properties that only affect JS don't cause CSS to be duplicated.
    // For example, with ESModule and CommonJS targets, only a single shared CSS bundle should be produced.
    let [code, originalMap] = await Promise.all([
      asset.getBuffer(),
      asset.getMap()
    ])

    let res = transform({
      filename: relative(options.projectRoot, asset.filePath),
      code,
      cssModules: true,
      analyzeDependencies: asset.meta.hasDependencies !== false,
      sourceMap: !!asset.env.sourceMap
    })

    asset.setBuffer(res.code)

    if (res.dependencies) {
      for (let dep of res.dependencies) {
        let loc = dep.loc

        if (originalMap) {
          loc = remapSourceLocation(loc, originalMap)
        }

        if (dep.type === "import" && !res.exports) {
          asset.addDependency({
            specifier: dep.url,
            specifierType: "url",
            loc,
            meta: {
              // For the glob resolver to distinguish between `@import` and other URL dependencies.
              isCSSImport: true,
              media: dep.media
            }
          })
        } else if (dep.type === "url") {
          asset.addURLDependency(dep.url, {
            loc,
            meta: {
              placeholder: dep.placeholder
            }
          })
        }
      }
    }

    return [asset]
  }
})
