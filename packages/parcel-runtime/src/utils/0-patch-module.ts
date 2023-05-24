import { vLog } from "@plasmo/utils/logging"

import type { BackgroundMessage, ExtensionApi, RuntimeData } from "../types"

// @ts-ignore
export const runtimeData = __plasmo_runtime_data__ as RuntimeData

module.bundle.HMR_BUNDLE_ID = runtimeData.bundleId

globalThis.process = {
  argv: [],
  env: {
    VERBOSE: runtimeData.verbose
  }
} as any

const OldModule = module.bundle.Module

function Module(moduleName: string) {
  OldModule.call(this, moduleName)
  this.hot = {
    data: module.bundle.hotData[moduleName],
    _acceptCallbacks: [],
    _disposeCallbacks: [],
    accept: function (fn) {
      this._acceptCallbacks.push(fn || function () {})
    },
    dispose: function (fn) {
      this._disposeCallbacks.push(fn)
    }
  }
  module.bundle.hotData[moduleName] = undefined
}

module.bundle.Module = Module
module.bundle.hotData = {}

export const extCtx: ExtensionApi =
  globalThis.chrome || globalThis.browser || null

export async function triggerReload(fullReload = false) {
  if (fullReload) {
    vLog("Triggering full reload")
    extCtx.runtime.sendMessage<BackgroundMessage>({
      __plasmo_full_reload__: true
    })
  } else {
    globalThis.location?.reload?.()
  }
}

export function getHostname() {
  if (!runtimeData.host || runtimeData.host === "0.0.0.0") {
    return location.protocol.indexOf("http") === 0
      ? location.hostname
      : "localhost"
  }

  return runtimeData.host
}

export function getPort() {
  return runtimeData.port || location.port
}

export const PAGE_PORT_PREFIX = `__plasmo_runtime_page_`
export const SCRIPT_PORT_PREFIX = `__plasmo_runtime_script_`
