// Forked from https://github.com/vercel/next.js/blob/canary/packages/next-env/index.ts
import { constantCase } from "change-case"
import dotenv from "dotenv"
import { expand as dotenvExpand } from "dotenv-expand"
import { readFile } from "fs/promises"
import { resolve } from "path"

import { isFile, isReadable } from "@plasmo/utils/fs"
import { eLog, iLog, vLog } from "@plasmo/utils/logging"

import { getFlagMap } from "~features/helpers/flag"

export type Env = Record<string, string | undefined>
type LoadedEnvFiles = Array<{
  name: string
  contents: string
}>

export const INTERNAL_ENV_PREFIX = "PLASMO_"
export const PUBLIC_ENV_PREFIX = "PLASMO_PUBLIC_"

const envFileSet = new Set<string>()

export class PlasmoPublicEnv {
  data: Env

  constructor(_env: Env) {
    this.data = Object.keys(_env)
      .filter((k) => k.startsWith(PUBLIC_ENV_PREFIX))
      .reduce((env, key) => {
        env[key] = _env[key]
        return env
      }, {} as Env)
  }

  extends(rawData: Env) {
    iLog("Loaded environment variables from:", [...envFileSet])
    const clone = new PlasmoPublicEnv({ ...this.data })
    clone.data["NODE_ENV"] = process.env.NODE_ENV
    Object.entries(rawData).forEach(([key, value]) => {
      clone.data[`${INTERNAL_ENV_PREFIX}${constantCase(key)}`] = value
    })
    return clone
  }
}

function cascadeEnv(loadedEnvFiles: LoadedEnvFiles) {
  const parsed: dotenv.DotenvParseOutput = {}

  for (const { contents, name } of loadedEnvFiles) {
    try {
      envFileSet.add(name)
      const result = dotenvExpand({
        parsed: dotenv.parse(contents)
      })

      if (!!result.parsed) {
        vLog(`Loaded env from ${name}`)
        const resultData = result.parsed || {}

        for (const envKey of Object.keys(resultData)) {
          if (typeof parsed[envKey] === "undefined") {
            parsed[envKey] = resultData[envKey]

            // Pass through internal env variables
            if (envKey.startsWith(INTERNAL_ENV_PREFIX)) {
              process.env[envKey] = resultData[envKey]
            }
          }
        }
      }
    } catch (err) {
      eLog(`Failed to load env from ${name}`, err)
    }
  }

  return parsed
}

export const getEnvFileNames = () => {
  const nodeEnv = process.env.NODE_ENV
  const flagMap = getFlagMap()
  return [
    flagMap.envPath,

    `.env.${flagMap.browser}.local`,
    `.env.${flagMap.tag}.local`,
    `.env.${nodeEnv}.local`,

    // Don't include `.env.local` for `test` environment
    // since normally you expect tests to produce the same
    // results for everyone
    nodeEnv !== "test" ? `.env.local` : "",

    `.env.${flagMap.browser}`,
    `.env.${flagMap.tag}`,
    `.env.${nodeEnv}`,
    ".env"
  ].filter((s) => !!s)
}

export async function loadEnvConfig(dir: string) {
  const allDotEnvEntries = await Promise.all(
    getEnvFileNames()
      .map((envFile) => [envFile, resolve(dir, envFile)])
      .map(
        async ([envFile, filePath]) =>
          [
            envFile,
            filePath,
            (await isFile(filePath)) && (await isReadable(filePath))
          ] as const
      )
  )

  const envFiles: LoadedEnvFiles = await Promise.all(
    allDotEnvEntries
      .filter(([, , isValid]) => isValid)
      .map(async ([envFile, filePath]) => ({
        name: envFile,
        contents: await readFile(filePath, "utf8")
      }))
  )

  const combinedEnv = cascadeEnv(envFiles)

  const plasmoPublicEnv = new PlasmoPublicEnv(combinedEnv)

  return { combinedEnv, plasmoPublicEnv, loadedEnvFiles: envFiles }
}

export type EnvConfig = Awaited<ReturnType<typeof loadEnvConfig>>
