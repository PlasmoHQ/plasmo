/**
 * Copyright (c) 2023 Plasmo Corp. <foss@plasmo.com> (https://www.plasmo.com) and contributors
 * MIT License
 *
 * Port refreshing code is based on https://github.com/crxjs/chrome-extension-tools/blob/main/packages/vite-plugin/src/client/es/hmr-client-worker.ts#L88
 *  MIT License
 * Copyright (c) 2019 jacksteamdev
 */

import { vLog } from "@plasmo/utils/logging"

import type { BackgroundMessage } from "../types"
import { runtimeData } from "../utils/0-patch-module"
import { isDependencyOfBundle } from "../utils/hmr-check"
import { injectHmrSocket } from "../utils/inject-socket"
import { createLoadingIndicator } from "../utils/loading-indicator"
import { reloadButton } from "../utils/reload-button"

let isActiveTab = false
const PORT_NAME = `__plasmo_runtime_script_${module.id}__`
let scriptPort: chrome.runtime.Port

async function consolidateUpdate() {
  vLog("Script Runtime - reloading")
  if (isActiveTab) {
    globalThis.location?.reload?.()
  } else {
    reloadButton().show()
  }
}

function reloadPort() {
  scriptPort?.disconnect()
  // Potentially, if MAIN world, we use the external connection instead (?)
  scriptPort = chrome.runtime.connect({
    name: PORT_NAME
  })

  scriptPort.onDisconnect.addListener(() => {
    consolidateUpdate()
  })

  scriptPort.onMessage.addListener((msg: BackgroundMessage) => {
    if (
      msg.__plasmo_cs_reload__ // bgsw reloaded, all context gone
    ) {
      consolidateUpdate()
      return
    }
    if (msg.__am_i_active_tab__) {
      isActiveTab = true
      return
    }
  })
}

function setupPort() {
  if (!chrome?.runtime) {
    return
  }

  try {
    reloadPort()
    setInterval(reloadPort, 240_000)
  } catch {
    return
  }
}

setupPort()

const loadingIndicator = createLoadingIndicator()

injectHmrSocket(async (updatedAssets) => {
  vLog("Script runtime - on updated assets", {
    module,
    runtimeData,
    updatedAssets
  })

  const isChanged = updatedAssets
    .filter((asset) => asset.envHash === runtimeData.envHash)
    .some((asset) => isDependencyOfBundle(module.bundle, asset.id))

  if (isChanged && isActiveTab) {
    loadingIndicator.show()
  }

  if (chrome.runtime) {
    scriptPort.postMessage({
      __plasmo_cs_changed__: isChanged
    } as BackgroundMessage)
  } else {
    if (isChanged) {
      setTimeout(() => {
        consolidateUpdate()
      }, 4_700)
    }
  }
})
