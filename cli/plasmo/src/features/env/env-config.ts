// Forked from https://github.com/vercel/next.js/blob/canary/packages/next-env/index.ts
import { constantCase } from "change-case"
import dotenv from "dotenv"
import { expand as dotenvExpand } from "dotenv-expand"
import { existsSync, statSync } from "fs"
import { readFile } from "fs/promises"
import { join } from "path"

import { eLog, iLog } from "@plasmo/utils/logging"

import { getFlagMap } from "~features/helpers/flag"

export type Env = Record<string, string | undefined>
export type LoadedEnvFiles = Array<{
  path: string
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

function processEnv(loadedEnvFiles: LoadedEnvFiles, dir?: string) {
  const parsed: dotenv.DotenvParseOutput = {}

  for (const envFile of loadedEnvFiles) {
    try {
      const result = dotenvExpand({
        parsed: dotenv.parse(envFile.contents)
      })

      if (!!result.parsed) {
        iLog(`Loaded env from ${join(dir || "", envFile.path)}`)
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
      eLog(`Failed to load env from ${join(dir || "", envFile.path)}`, err)
    }
  }

  return parsed
}

export async function loadEnvConfig(dir: string) {
  const nodeEnv = process.env.NODE_ENV
  const flagMap = getFlagMap()

  const dotenvFilePaths = [
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
  ]
    .filter((s) => !!s)
    .map((envFile) => [envFile, join(dir, envFile)])
    .filter(
      ([, filePath]) => existsSync(filePath) && statSync(filePath).isFile()
    )

  const envFiles: LoadedEnvFiles = []

  for await (const [envFile, filePath] of dotenvFilePaths) {
    try {
      const contents = await readFile(filePath, "utf8")
      envFiles.push({
        path: envFile,
        contents
      })
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        eLog(`Failed to load env from ${envFile}`, err)
      }
    }
  }

  const combinedEnv = processEnv(envFiles, dir)

  const plasmoPublicEnv = new PlasmoPublicEnv(combinedEnv)

  return { combinedEnv, plasmoPublicEnv, loadedEnvFiles: envFiles }
}

export type EnvConfig = Awaited<ReturnType<typeof loadEnvConfig>>
