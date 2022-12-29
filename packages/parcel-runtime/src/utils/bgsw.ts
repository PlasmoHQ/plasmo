import { extCtx, getHostname, getPort, runtimeData } from "./0-patch-module"

const devServer = `${
  runtimeData.secure ? "https" : "http"
}://${getHostname()}:${getPort()}/`

export async function pollingDevServer(delay = 1470) {
  while (true) {
    try {
      await fetch(devServer)
      break
    } catch (e) {
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
}

export async function proxyHmr() {
  if (extCtx.runtime.getManifest().manifest_version === 3) {
    const proxyLoc = extCtx.runtime.getURL("/__plasmo_hmr_proxy__?url=")

    globalThis.addEventListener("fetch", function (evt: FetchEvent) {
      const reqUrl = evt.request.url
      if (reqUrl.startsWith(proxyLoc)) {
        const url = new URL(decodeURIComponent(reqUrl.slice(proxyLoc.length)))
        if (
          url.hostname === runtimeData.host &&
          url.port === `${runtimeData.port}`
        ) {
          url.searchParams.set("t", Date.now().toString())
          evt.respondWith(
            fetch(url).then(
              (res) =>
                new Response(res.body, {
                  headers: {
                    "Content-Type":
                      res.headers.get("Content-Type") ?? "text/javascript"
                  }
                })
            )
          )
        } else {
          evt.respondWith(
            new Response("Plasmo HMR", {
              status: 200,
              statusText: "Testing"
            })
          )
        }
      }
    })
  }
}
