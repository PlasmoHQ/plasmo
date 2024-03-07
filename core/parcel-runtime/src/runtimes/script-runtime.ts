/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Port refreshing code is based on https://github.com/crxjs/chrome-extension-tools/blob/963e41149cdf327eaa338c643c58909e30d69651/packages/vite-plugin/src/client/es/hmr-client-worker.ts#L88
 *  MIT License
 * Copyright (c) 2019 jacksteamdev
 */

import { vLog } from "@plasmo/utils/logging"

import type { BackgroundMessage } from "../types"
import {
  extCtx,
  runtimeData,
  SCRIPT_PORT_PREFIX
} from "../utils/0-patch-module"
import { isDependencyOfBundle } from "../utils/hmr-check"
import { injectHmrSocket } from "../utils/inject-socket"
import { createLoadingIndicator } from "../utils/loading-indicator"

const PORT_NAME = `${SCRIPT_PORT_PREFIX}${module.id}__`
let scriptPort: chrome.runtime.Port
let isActiveTab = false

const loadingIndicator = createLoadingIndicator()

async function consolidateUpdate() {
  vLog("Script Runtime - reloading")
  if (isActiveTab) {
    globalThis.location?.reload?.()
  } else {
    loadingIndicator.show({
      reloadButton: true
    })
  }
}

function reloadPort() {
  scriptPort?.disconnect()
  // Potentially, if MAIN world, we use the external connection instead (?)
  scriptPort = extCtx?.runtime.connect({
    name: PORT_NAME
  })

  scriptPort.onDisconnect.addListener(() => {
    consolidateUpdate()
  })

  scriptPort.onMessage.addListener((msg: BackgroundMessage) => {
    // bgsw reloaded, all context gone
    if (msg.__plasmo_cs_reload__) {
      consolidateUpdate()
    }

    if (msg.__plasmo_cs_active_tab__) {
      isActiveTab = true
    }
    return
  })
}

function setupPort() {
  if (!extCtx?.runtime) {
    return
  }

  try {
    reloadPort()
    setInterval(reloadPort, 24_000)
  } catch {
    return
  }
}

setupPort()

injectHmrSocket(async (updatedAssets) => {
  vLog("Script runtime - on updated assets")

  const isChanged = updatedAssets
    .filter((asset) => asset.envHash === runtimeData.envHash)
    .some((asset) => isDependencyOfBundle(module.bundle, asset.id))

  if (isChanged) {
    loadingIndicator.show()

    if (extCtx?.runtime) {
      scriptPort.postMessage({
        __plasmo_cs_changed__: true
      } as BackgroundMessage)
    } else {
      setTimeout(() => {
        consolidateUpdate()
      }, 4_700)
    }
  }
})
