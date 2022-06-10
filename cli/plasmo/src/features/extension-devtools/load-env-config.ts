// Forked from https://github.com/vercel/next.js/blob/canary/packages/next-env/index.ts
import dotenv from "dotenv"
import { expand as dotenvExpand } from "dotenv-expand"
import { existsSync, statSync } from "fs"
import { readFile } from "fs/promises"
import { join } from "path"

import { eLog, iLog } from "@plasmo/utils"

export type Env = Record<string, string>
export type LoadedEnvFiles = Array<{
  path: string
  contents: string
}>

function processEnv(loadedEnvFiles: LoadedEnvFiles, dir?: string) {
  const parsed: dotenv.DotenvParseOutput = {}

  for (const envFile of loadedEnvFiles) {
    try {
      let result: dotenv.DotenvConfigOutput = {}
      result.parsed = dotenv.parse(envFile.contents)

      result = dotenvExpand(result)

      if (result.parsed) {
        iLog(`Loaded env from ${join(dir || "", envFile.path)}`)
      }

      for (const key of Object.keys(result.parsed || {})) {
        if (typeof parsed[key] === "undefined") {
          parsed[key] = result.parsed?.[key]!
        }
      }
    } catch (err) {
      eLog(`Failed to load env from ${join(dir || "", envFile.path)}`, err)
    }
  }

  return parsed
}

export async function loadEnvConfig(dir: string) {
  const mode = process.env.NODE_ENV
  const dotenvFilePaths = [
    `.env.${mode}.local`,
    // Don't include `.env.local` for `test` environment
    // since normally you expect tests to produce the same
    // results for everyone
    mode !== "test" && `.env.local`,
    `.env.${mode}`,
    ".env"
  ]
    .filter(Boolean)
    .map((envFile) => [envFile, join(dir, envFile)])
    .filter(
      ([, filePath]) => existsSync(filePath) && statSync(filePath).isFile()
    )

  const envFiles = await Promise.all(
    dotenvFilePaths.map(async ([envFile, filePath]) => {
      try {
        const contents = await readFile(filePath, "utf8")
        return {
          path: envFile,
          contents
        }
      } catch (err: any) {
        if (err.code !== "ENOENT") {
          eLog(`Failed to load env from ${envFile}`, err)
        }
      }
    })
  )

  const combinedEnv = processEnv(envFiles, dir)

  const plasmoPublicEnv = Object.keys(combinedEnv)
    .filter((k) => k.startsWith("PLASMO_PUBLIC_"))
    .reduce((env, key) => {
      env[key] = combinedEnv[key]
      return env
    }, {})

  return { combinedEnv, plasmoPublicEnv, loadedEnvFiles: envFiles }
}

export type EnvConfig = Awaited<ReturnType<typeof loadEnvConfig>>
