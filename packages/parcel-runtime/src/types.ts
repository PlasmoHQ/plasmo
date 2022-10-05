declare global {
  const __parcel__import__: Function
  const __parcel__importScripts__: Function
  const ServiceWorkerGlobalScope: any

  interface NodeModule {
    bundle: ParcelRequire
  }
}

export type ExtensionApi = typeof globalThis.chrome

interface ParcelModule {
  hot: {
    data: unknown
    accept(cb: (arg0: (...args: Array<any>) => any) => void): void
    dispose(cb: (arg0: unknown) => void): void
    _acceptCallbacks: Array<(arg0: (...args: Array<any>) => any) => any>
    _disposeCallbacks: Array<(arg0: unknown) => void>
  }
}
export interface ParcelRequire {
  (arg0: string): unknown
  cache: Record<string, ParcelModule>
  hotData: unknown
  Module: any
  parent: ParcelRequire | null | undefined
  isParcelRequire: true
  modules: Record<
    string,
    [(...args: Array<any>) => any, Record<string, string>]
  >
  HMR_BUNDLE_ID: string
  root: ParcelRequire
}

export type HmrData = {
  host: string
  port: number
  secure: boolean
  bundleId: string

  serverPort?: number
}

export type HmrAsset = {
  id: string
  url: string
  type: string
  output: string
  envHash: string
  outputFormat: string
  depsByBundle: Record<string, Record<string, string>>
}
export type HmrMessage =
  | {
      type: "update"
      assets: Array<HmrAsset>
    }
  | {
      type: "error"
      diagnostics: {
        ansi: Array<any>
        html: Array<{
          codeframe: string
        }>
      }
    }
