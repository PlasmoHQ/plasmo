import { Resolver } from "@parcel/plugin"
import NodeResolver from '@parcel/node-resolver-core';
import type { ResolverResult } from "./shared";
import { build } from 'esbuild'

export default new Resolver({
  async loadConfig({config, options, logger}) {
    let conf = await config.getConfig([], {
      packageKey: '@parcel/resolver-default',
    });

    return new NodeResolver({
      fs: options.inputFS,
      projectRoot: options.projectRoot,
      packageManager: options.packageManager,
      shouldAutoInstall: options.shouldAutoInstall,
      mode: options.mode,
      logger,
      packageExports: conf?.contents?.packageExports ?? false,
    });
  },
  async resolve({specifier, dependency, options, config: resolver}) {
    
    if (!specifier.startsWith("inline:")) {
      return null
    }
    const without = specifier.slice(7)
    const result: ResolverResult = await resolver.resolve({
      filename: without,
      specifierType: dependency.specifierType,
      range: dependency.range,
      parent: dependency.resolveFrom,
      env: dependency.env,
      sourcePath: dependency.sourcePath,
      loc: dependency.loc,
      packageConditions: dependency.packageConditions,
    });

    if (!result) {
      return null
    }

    const code = await options.inputFS.readFile(result.filePath, 'utf8')
    let out = await build({
      bundle: true,
      format: 'iife',
      write: false,
      stdin: {
        contents: code,
        resolveDir: options.projectRoot,
        sourcefile: result.filePath,
        loader: 'default'
      },
      banner: {
        js: 'module.exports = (...args) => {'
      },
      footer: {
        js: '__plasmo_inlinefunc.default(...args); }'
      },
      globalName: '__plasmo_inlinefunc',
      preserveSymlinks: true,
      platform: 'browser',
      absWorkingDir: options.projectRoot,
      treeShaking: true
    })

    if (out.outputFiles.length === 0) {
      return null
    }
  
    return {
      code: out.outputFiles[0].text,
      sideEffects: true,
      invalidateOnEnvChange: result.invalidateOnEnvChange,
      invalidateOnFileCreate: result.invalidateOnFileCreate,
      invalidateOnFileChange: result.invalidateOnFileChange
    }
  }
})
