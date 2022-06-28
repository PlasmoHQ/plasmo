export const runMap = {
  help: () => import("./help"),

  //#ifdef !IS_BINARY
  start: () => import("./start"),
  init: () => import("./init"),
  dev: () => import("./dev"),
  build: () => import("./build"),
  //#endif

  version: () => import("./version"),
  ["-v"]: () => import("./version"),
  ["--version"]: () => import("./version")
}

export type ValidCommand = keyof typeof runMap

export const validCommandList = Object.keys(runMap) as ValidCommand[]

export const validCommandSet = new Set(validCommandList)
