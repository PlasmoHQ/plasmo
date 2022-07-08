const ReconnectingWebSocket = require("reconnecting-websocket")

function getHostname() {
  return (
    HMR_HOST ||
    (location.protocol.indexOf("http") === 0 ? location.hostname : "localhost")
  )
}

function getPort() {
  return HMR_PORT || location.port
}

var parent = module.bundle.parent
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== "undefined") {
  var hostname = getHostname()
  var port = getPort()
  var protocol =
    HMR_SECURE ||
    (location.protocol == "https:" &&
      !/localhost|127.0.0.1|0.0.0.0/.test(hostname))
      ? "wss"
      : "ws"

  // WebSocket will automatically reconnect if the connection is lost. (i.e. restarting `plasmo dev`)
  var ws = new ReconnectingWebSocket(
    protocol + "://" + hostname + (port ? ":" + port : "") + "/"
  )

  // If there's an error it's probably because of a race
  // between this content script and the extension reloading
  if (chrome.runtime.lastError) {
    location.reload()
  }

  ws.onmessage = async function (event) {
    if (!chrome.runtime.id) {
      return
    }
    var data /*: HMRMessage */ = JSON.parse(event.data)

    if (data.type === "update") {
      if (data.assets.filter((e) => e.type === "json").length > 0) {
        // If it's a manifest change, we must reload the entire app
        if (
          chrome &&
          chrome.runtime &&
          typeof chrome.runtime.reload === "function"
        ) {
          chrome.runtime.reload()
        } else {
          // Content scripts can't reload the extension on their own
          // so we need to send a message to the background service worker
          // to do it for us, using Parcel's webextension runtime's background worker
          chrome.runtime.sendMessage({ __parcel_hmr_reload__: true })
          location.reload()
        }
      } else {
        // Otherwise, we check whether they have location.reload()
        // If they do, we reload the page. Otherwise, we reload the entire extension
        if (!!location && typeof location.reload === "function") {
          location.reload()
        } else {
          chrome.runtime.reload()
        }
      }
    }

    if (data.type === "error") {
      // Log parcel errors to console
      for (let ansiDiagnostic of data.diagnostics.ansi) {
        let stack = ansiDiagnostic.codeframe
          ? ansiDiagnostic.codeframe
          : ansiDiagnostic.stack

        console.error(
          "🟡 [plasmo/parcel-runtime]: " +
            ansiDiagnostic.message +
            "\n" +
            stack +
            "\n\n" +
            ansiDiagnostic.hints.join("\n")
        )
      }
    }
  }
  ws.onerror = function (e) {
    console.error(e.message)
  }
  ws.onclose = function (e) {
    if (process.env.PARCEL_BUILD_ENV !== "test") {
      console.warn(
        "🟡 [plasmo/parcel-runtime]: Connection to the HMR server was lost, trying to reconnect..."
      )
    }
  }
}
