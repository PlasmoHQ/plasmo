/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Based on: https://github.com/zachbryant/parcel-resolver-tspaths
 * Copyright (c) 2021 Zach Bryant
 * MIT License
 */

import { dirname, extname, join, resolve } from "path"
import { loadConfig } from "@parcel/utils"
import type { CompilerOptions } from "typescript"

import { isReadable } from "@plasmo/utils/fs"

import type { ResolverProps, ResolverResult } from "./shared"
import { checkWebpackSpecificImportSyntax, findModule, trimStar } from "./utils"

const tsRegex = /\.(tsx?)|vue|svelte$/

const relevantExtList = [
  ".ts",
  ".tsx",
  ".svelte",
  ".vue",
  ".json",

  ".css",
  ".scss",
  ".sass",
  ".less",

  ".svg",

  ".js",
  ".jsx"
] as const

const relevantExtSet = new Set(relevantExtList)

type TsPaths = string[]

type TsPathsMap = Map<string, TsPaths>

const state = {
  pathsMap: null as TsPathsMap,
  pathsMapRegex: null as [string, TsPaths, RegExp][]
}

export async function handleTsPath(
  props: ResolverProps
): Promise<ResolverResult> {
  try {
    const { dependency } = props

    checkWebpackSpecificImportSyntax(dependency.specifier)

    const isTypescript = tsRegex.test(dependency.resolveFrom)

    if (!isTypescript) {
      return null
    }

    const compilerOptions = await getTsconfigCompilerOptions(props)

    if (compilerOptions.length === 0) {
      return null
    }

    loadTsPathsMap(compilerOptions)

    const result = attemptResolve(props)

    if (!result) {
      return null
    }

    return {
      filePath: result
    }
  } catch {
    return null
  }
}

/** Populate a map with any paths from tsconfig.json starting from baseUrl */
function loadTsPathsMap(tsConfigs: TSConfig[]) {
  if (state.pathsMap) {
    return
  }

  const tsPathsMap = new Map<string, TsPaths>()
  tsConfigs.forEach((tsConfig) => loadPathsFromTSConfig(tsConfig, tsPathsMap))

  state.pathsMap = tsPathsMap
  state.pathsMapRegex = Array.from(tsPathsMap.entries()).map((entry) => [
    ...entry,
    new RegExp(`^${entry[0].replace("*", ".*")}$`)
  ])
}

function loadPathsFromTSConfig(
  tsConfig: TSConfig,
  tsPathsMap: Map<string, TsPaths>
) {
  const { filePath, compilerOptions } = tsConfig

  const baseUrl = compilerOptions.baseUrl || "."
  const tsPaths = compilerOptions.paths || {}

  const tsConfigFolderPath = join(dirname(join(filePath)), baseUrl)

  for (const key in tsPaths) {
    tsPathsMap.set(
      key,
      tsPaths[key].map((p) => join(tsConfigFolderPath, p))
    )
  }
}

function attemptResolve({ specifier, dependency }: ResolverProps) {
  const { pathsMap, pathsMapRegex } = state
  if (pathsMap.has(specifier)) {
    return attemptResolveArray(
      specifier,
      specifier,
      pathsMap.get(specifier),
      dependency.resolveFrom
    )
  }

  const relevantEntry = pathsMapRegex.find(([, , aliasRegex]) =>
    aliasRegex.test(specifier)
  )

  if (!!relevantEntry) {
    return attemptResolveArray(
      specifier,
      relevantEntry[0],
      relevantEntry[1],
      dependency.resolveFrom
    )
  }

  return null
}

// TODO support resource loaders like 'url:@alias/my.svg'
/** Attempt to resolve any path associated with the alias to a file or directory index */
function attemptResolveArray(
  from: string,
  alias: string,
  realPaths: TsPaths,
  parentFile: string
) {
  for (const option of realPaths) {
    const absoluteBaseFile = resolve(
      from.replace(trimStar(alias), trimStar(option))
    )

    const importExt = extname(absoluteBaseFile)

    if (importExt.length > 0 && relevantExtSet.has(importExt as any)) {
      return absoluteBaseFile
    }

    const parentExt = extname(parentFile)

    const checkingExts = [
      parentExt,
      ...relevantExtList.filter((ext) => ext !== parentExt)
    ]

    const mod = findModule(absoluteBaseFile, checkingExts)

    if (mod !== null) {
      return mod
    }
  }
  return null
}

type TSConfig = { compilerOptions: CompilerOptions; filePath: string }

async function getTsconfigCompilerOptions(
  props: ResolverProps & { tsconfigPath?: string },
  tsConfigs: TSConfig[] = [],
  depth = 0
): Promise<TSConfig[]> {
  if (depth > 42) {
    throw new Error(
      "Something went wrong in loading tsconfig (depth > 42). Circular dependency?"
    )
  }

  const { options, dependency, tsconfigPath } = props

  const tsconfigPathList = tsconfigPath
    ? [tsconfigPath]
    : ["tsconfig.json", "tsconfig.js"]

  const result = await loadConfig(
    options.inputFS,
    dependency.resolveFrom,
    tsconfigPathList,
    join(process.env.PLASMO_PROJECT_DIR, "lab")
  )

  const compilerOptions = result?.config?.compilerOptions as CompilerOptions

  if (!compilerOptions) {
    return tsConfigs
  }

  const filePath = result.files[0].filePath

  const output = { compilerOptions, filePath }
  try {
    if (result.config.extends) {
      const extendsTsconfigPath = (await isReadable(
        resolve(result.config.extends)
      ))
        ? resolve(result.config.extends)
        : require.resolve(result.config.extends, {
            paths: [dependency.resolveFrom]
          })

      return await getTsconfigCompilerOptions(
        {
          ...props,
          tsconfigPath: extendsTsconfigPath
        },
        [output, ...tsConfigs],
        ++depth
      )
    }
  } catch {}

  return [output, ...tsConfigs]
}
