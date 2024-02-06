import { Resolver } from "@parcel/plugin"
import NodeResolver from '@parcel/node-resolver-core';
import type { ResolveResult } from "@parcel/types"
import { vLog, eLog, wLog } from "@plasmo/utils/logging"
import { build, type BuildOptions } from 'esbuild'
import { posix } from "path"
import type { InlinefuncResolverConfig, PlasmoExtendedPackageJSON } from "./types";

export default new Resolver({
  async loadConfig({ config, options, logger }) {
    let conf = await config.getConfig([], {
      packageKey: '@parcel/resolver-default',
    });
    const packageJSON = await config.getPackage() as PlasmoExtendedPackageJSON
    const resolver = new NodeResolver({
      fs: options.inputFS,
      projectRoot: options.projectRoot,
      packageManager: options.packageManager,
      shouldAutoInstall: options.shouldAutoInstall,
      mode: options.mode,
      logger,
      packageExports: conf?.contents?.packageExports ?? false,
    })
    return { resolver, config: packageJSON.plasmo?.inlinefunc } as InlinefuncResolverConfig;
  },
  async resolve({ specifier, dependency, options, config: { resolver, config } }) {
    vLog("@plasmohq/parcel-resolver-inlinefunc")
    const prefix = 'inlinefunc:'
    if (!specifier.startsWith(prefix)) {
      return null
    }

    vLog(`found matching specifier: ${specifier}`)
    const without = specifier.slice(prefix.length)
    const result: ResolveResult = await resolver.resolve({
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
      eLog(`failed to resolve: ${specifier}`)
      return null
    }

    let overrides = {}

    try {
      if (config) {
        vLog(`inlinefunc configuration detected:\n${JSON.stringify(config, null, 2)}`)

        const esbuildConfig = config.esbuild.config
        const resolved = posix.join('file://', options.projectRoot, esbuildConfig)
        const exported = await import(resolved)
        overrides = { ...exported }
        vLog(`loaded esbuild config overrides:\n${JSON.stringify(overrides, null, 2)}`)
      }
    } catch (e) {
      eLog('error with dynamic import', e)
    }

    vLog(`reading code from resolved filepath: ${result.filePath}`)
    const code = await options.inputFS.readFile(result.filePath, 'utf8')

    let out

    try {
      const args = {
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
        treeShaking: true,
        ...overrides
      } as BuildOptions
      vLog('starting esbuild with arguments:\n', args)
      out = await build(args)
    } catch (e) {
      eLog('error with esbuild:', e)
      return null
    }

    if (!out || out.outputFiles.length === 0) {
      wLog('esbuild failed to product output files')
      return null
    }

    return {
      filePath: result.filePath,
      code: out.outputFiles[0].text,
      sideEffects: true,
      invalidateOnEnvChange: result.invalidateOnEnvChange,
      invalidateOnFileCreate: result.invalidateOnFileCreate,
      invalidateOnFileChange: result.invalidateOnFileChange
    }
  }
})
