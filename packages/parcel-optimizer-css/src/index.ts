import { transformStyleAttribute } from "@parcel/css"
import { Optimizer } from "@parcel/plugin"
import { blobToBuffer } from "@parcel/utils"

export default new Optimizer({
  async optimize({ bundle, contents: prevContents, map: prevMap }) {
    console.log("HERE BRO")
    const code = await blobToBuffer(prevContents)
    console.log(code.toString())

    console.log(bundle.bundleBehavior)
    console.log(bundle.env.shouldOptimize)

    if (!bundle.env.shouldOptimize) {
      return {
        contents: prevContents,
        map: prevMap
      }
    }

    // Inline style attributes in HTML need to be parsed differently from full CSS files.
    if (bundle.bundleBehavior === "inline") {
      let entry = bundle.getMainEntry()

      console.log(entry.filePath)

      if (entry?.meta.type === "attr") {
        let result = transformStyleAttribute({
          code,
          minify: true
        })
        return {
          contents: result.code
        }
      }
    } else {
      return {
        contents: prevContents,
        map: prevMap
      }
    }
  }
})
