declare namespace NodeJS {
  interface ProcessEnv {
    PLASMO_TARGET: string
    PLASMO_BROWSER: string
    PLASMO_MANIFEST_VERSION: string
  }
}

declare module "data-text:*" {
  const value: string
  export default value
}

declare module "data-base64:*" {
  const value: string
  export default value
}

declare module "url:*" {
  const value: string
  export default value
}
