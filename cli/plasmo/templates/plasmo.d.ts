declare namespace NodeJS {
  interface ProcessEnv {
    PLASMO_TARGET: string
    PLASMO_BROWSER: string
    PLASMO_MANIFEST_VERSION: string
  }
}

declare module "*.module.css" {
  const styles: Record<string, string>
  export default styles
}

declare module "url:*" {
  const value: string
  export default value
}

declare module "data-text:*" {
  const value: string
  export default value
}

declare module "data-base64:*" {
  const value: string
  export default value
}

declare module "data-env:*" {
  const value: string
  export default value
}

declare module "data-text-env:*" {
  const value: string
  export default value
}

declare module "raw:*" {
  const value: string
  export default value
}

declare module "raw-env:*" {
  const value: string
  export default value
}
