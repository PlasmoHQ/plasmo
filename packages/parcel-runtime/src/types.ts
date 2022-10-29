declare global {
  const __parcel__import__: Function
  const __parcel__importScripts__: Function
  interface Window {
    $RefreshReg$: any
    $RefreshSig$: any
  }

  interface NodeModule {
    bundle: ParcelBundle
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
export interface ParcelBundle {
  (arg0: string): unknown
  cache: Record<string, ParcelModule>
  hotData: unknown
  Module: any
  parent: ParcelBundle | null | undefined
  isParcelRequire: true
  modules: Record<
    string,
    [(...args: Array<any>) => any, Record<string, string>]
  >
  HMR_BUNDLE_ID: string
  root: ParcelBundle
}

export type RuntimeData = {
  isReact: boolean
  isBackground: boolean
  isContentScript: boolean

  host?: string
  port?: number

  secure: boolean
  serverPort?: number

  verbose: "true" | "false"

  entryFilePath: string
  bundleId: string
  envHash: string
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

export type BackgroundMessage = {
  __plasmo_full_reload__?: boolean
  __plasmo_check_active__?: boolean
}
