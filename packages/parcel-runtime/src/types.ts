export type HmrData = {
  host: string
  port: number
  secure: boolean
  bundleId: string

  serverPort?: number
}

export type HMRAsset = {
  id: string
  url: string
  type: string
  output: string
  envHash: string
  outputFormat: string
  depsByBundle: Record<string, Record<string, string>>
}
export type HMRMessage =
  | {
      type: "update"
      assets: Array<HMRAsset>
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
