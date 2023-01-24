// Forked from https://github.com/vercel/next.js/blob/canary/packages/next-env/index.ts
import { constantCase } from "change-case"
import dotenv from "dotenv"
import { expand as dotenvExpand } from "dotenv-expand"
import { readFile } from "fs/promises"
import { join, resolve } from "path"

import { isFile, isReadable } from "@plasmo/utils/fs"
import { eLog, iLog } from "@plasmo/utils/logging"

import { getFlagMap } from "~features/helpers/flag"

export type Env = Record<string, string | undefined>
type LoadedEnvFiles = Array<{
  filePath: string
  contents: string
}>

export const EMBED_ENV_PREFIX = "PLASMO_"
export const PUBLIC_ENV_PREFIX = "PLASMO_PUBLIC_"

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
    const clone = new PlasmoPublicEnv({ ...this.data })
    clone.data["NODE_ENV"] = process.env.NODE_ENV
    Object.entries(rawData).forEach(([key, value]) => {
      clone.data[`PLASMO_${constantCase(key)}`] = value
    })
    return clone
  }
}

function cascadeEnv(loadedEnvFiles: LoadedEnvFiles) {
  const parsed: dotenv.DotenvParseOutput = {}

  for (const { contents, filePath } of loadedEnvFiles) {
    try {
      const result = dotenvExpand({
        parsed: dotenv.parse(contents)
      })

      if (!!result.parsed) {
        iLog(`Loaded env from ${filePath}`)
        const resultData = result.parsed || {}

        for (const key of Object.keys(resultData)) {
          if (typeof parsed[key] === "undefined") {
            parsed[key] = resultData[key]

            if (key.startsWith(EMBED_ENV_PREFIX)) {
              process.env[key] = resultData[key]
            }
          }
        }
      }
    } catch (err) {
      eLog(`Failed to load env from ${join(filePath)}`, err)
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
      .map((envFile) => resolve(dir, envFile))
      .map(
        async (filePath) =>
          [
            filePath,
            (await isFile(filePath)) && (await isReadable(filePath))
          ] as const
      )
  )

  const envFiles: LoadedEnvFiles = await Promise.all(
    allDotEnvEntries
      .filter(([, isValid]) => isValid)
      .map(async ([filePath]) => ({
        filePath,
        contents: await readFile(filePath, "utf8")
      }))
  )

  const combinedEnv = cascadeEnv(envFiles)

  const plasmoPublicEnv = new PlasmoPublicEnv(combinedEnv)

  return { combinedEnv, plasmoPublicEnv, loadedEnvFiles: envFiles }
}

export type EnvConfig = Awaited<ReturnType<typeof loadEnvConfig>>
