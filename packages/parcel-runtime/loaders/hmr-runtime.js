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
  var ws = new WebSocket(
    protocol + "://" + hostname + (port ? ":" + port : "") + "/"
  )

  ws.onmessage = async function (event) {
    var acceptedAssets = {}
    var assetsToAccept = []

    var data /*: HMRMessage */ = JSON.parse(event.data)

    if (data.type === "update") {
      if (data.assets.filter((e) => e.type === "json").length > 0) {
        // If it's a manifest change, we must reload the entire app
        chrome.runtime.reload()
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
          "🚨 [parcel]: " +
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
      console.warn("[parcel] 🚨 Connection to the HMR server was lost")
    }
  }
}
