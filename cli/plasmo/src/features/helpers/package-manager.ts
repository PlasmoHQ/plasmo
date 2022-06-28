/**
 * Forked from https://github.com/vercel/next.js/blob/canary/packages/create-next-app/helpers/get-pkg-manager.ts
 */
import spawnAsync from "@expo/spawn-async"
import semver from "semver"

export type PackageManager = "npm" | "pnpm" | "yarn"

export type PackageManagerInfo = {
  name: PackageManager
  version?: string
}

async function getPMInfo(name: PackageManager): Promise<PackageManagerInfo> {
  const data = await spawnAsync(name, ["--version"])
  const version = semver.valid(data.stdout.trim())
  return { name, version }
}

export async function getPackageManager(): Promise<PackageManagerInfo> {
  try {
    const userAgent = process.env.npm_config_user_agent

    if (userAgent) {
      if (userAgent.startsWith("yarn")) {
        return { name: "yarn" }
      } else if (userAgent.startsWith("pnpm")) {
        return { name: "pnpm" }
      }
    }
    try {
      return await getPMInfo("pnpm")
    } catch {
      return await getPMInfo("yarn")
    }
  } catch {
    return await getPMInfo("npm")
  }
}
