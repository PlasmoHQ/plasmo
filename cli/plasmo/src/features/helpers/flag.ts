import { kebabCase } from "change-case"

import { getFlag } from "@plasmo/utils/flags"

export const getFlagMap = () => {
  const srcPath = getFlag("--src-path") || process.env.PLASMO_SRC_PATH || "src"

  const buildPath =
    getFlag("--build-path") || process.env.PLASMO_BUILD_PATH || "build"

  const tag =
    getFlag("--tag") ||
    process.env.PLASMO_TAG ||
    (process.env.NODE_ENV === "production" ? "prod" : "dev")

  const target = kebabCase(
    getFlag("--target") || process.env.PLASMO_TARGET || "chrome-mv3"
  )

  const [browser, manifestVersion] = target.split("-")

  const entry = getFlag("--entry") || "popup"

  const envPath = getFlag("--env")

  return {
    browser,
    manifestVersion,
    tag,
    srcPath,
    buildPath,
    target,
    entry,
    envPath
  }
}

const DEV_BUILD_COMMON_ARGS = `      --target=[string]           set the target (default: chrome-mv3)
      --tag=[string]              set the build tag (default: dev or prod depending on NODE_ENV)
      --src-path=[path]           set the source path relative to project root (default: src)
      --build-path=[path]         set the build path relative to project root (default: build)
      --entry=[name]              entry point name (default: popup)
      --env=[path]                relative path to top-level env file
      --no-cs-reload              disable content script auto reloading`

export const flagHelp = `
    
    init

      --entry=[name]              entry files (default: popup)
      --with-<name>               use an example template

    dev     

${DEV_BUILD_COMMON_ARGS}

    build

${DEV_BUILD_COMMON_ARGS}
      --zip                       zip the build output
`
