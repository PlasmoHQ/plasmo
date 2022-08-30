declare namespace NodeJS {
  interface ProcessEnv {
    PLASMO_TARGET: string
    PLASMO_BROWSER: string
    PLASMO_MANIFEST_VERSION: string
  }
}

declare module "*.json" {
  const data: Record<string, any>
  export default data
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
  export * from "url:*"
}

declare module "data-base64:*" {
  export * from "url:*"
}

declare module "data-env:*" {
  export * from "url:*"
}

declare module "data-text-env:*" {
  export * from "url:*"
}

declare module "raw:*" {
  export * from "url:*"
}

declare module "raw-env:*" {
  export * from "url:*"
}
