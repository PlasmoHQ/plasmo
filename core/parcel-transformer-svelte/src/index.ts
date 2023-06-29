/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/HellButcher/parcel-transformer-svelte3-plus
 * Copyright (c) 2023 Christoph Hommelsheim
 * MIT License
 */
import ThrowableDiagnostic from "@parcel/diagnostic"
import { Transformer } from "@parcel/plugin"
import { relativeUrl } from "@parcel/utils"
import { type CompileOptions, compile, preprocess } from "svelte/compiler"

import { convertError } from "./convert-error"
import { extendSourceMap } from "./source-map"

export default new Transformer({
  async loadConfig({ config, options }) {
    const conf = await config.getConfig(
      [".svelterc", "svelte.config.js", "svelte.config.cjs"],
      {
        packageKey: "svelte"
      }
    )

    let contents = {} as any
    if (conf && typeof conf.contents === "object") {
      contents = conf.contents
      if (conf.filePath.endsWith(".js") || conf.filePath.endsWith(".cjs")) {
        config.invalidateOnStartup()
      }
    }

    const compilerOptions = contents.compilerOptions || contents.compiler || {}

    return {
      compilerOptions: {
        dev: options.mode !== "production",
        css: "external",
        ...compilerOptions
      } as CompileOptions,
      preprocess: contents.preprocess,
      filePath: conf && conf.filePath
    }
  },

  async transform({ asset, config, options, logger }) {
    const [code, originalMap] = await Promise.all([
      asset.getCode(),
      asset.getMap()
    ])

    let finalCode = code

    try {
      // Retrieve the asset's source code and source map.
      const filename = relativeUrl(
        options.projectRoot,
        asset.filePath
      ) as string

      const compilerOptions = {
        filename,
        ...(config.compilerOptions || {})
      }

      if (config.preprocess) {
        const preprocessed = await preprocess(
          code,
          config.preprocess,
          compilerOptions
        )

        if (preprocessed.map) compilerOptions.sourcemap = preprocessed.map
        if (preprocessed.dependencies) {
          for (const dependency of preprocessed.dependencies) {
            asset.invalidateOnFileChange(dependency)
          }
        }
        finalCode = preprocessed.code
      }

      const compiled = compile(finalCode, compilerOptions)

      compiled.warnings?.forEach((warning) => {
        if (compilerOptions.css && warning.code === "css-unused-selector")
          return
        logger.warn(convertError(asset, originalMap, finalCode, warning))
      })

      const results = [
        {
          type: "js",
          content: compiled.js.code,
          uniqueKey: `${asset.id}-js`,
          map: extendSourceMap(
            options,
            asset.filePath,
            originalMap,
            compiled.js.map
          )
        }
      ]
      if (compiled.css && compiled.css.code) {
        results.push({
          type: "css",
          content: compiled.css.code,
          uniqueKey: `${asset.id}-css`,
          map: extendSourceMap(
            options,
            asset.filePath,
            originalMap,
            compiled.css.map
          )
        })
      }
      return results
    } catch (error) {
      throw new ThrowableDiagnostic({
        diagnostic: convertError(asset, originalMap, finalCode, error)
      })
    }
  }
})
