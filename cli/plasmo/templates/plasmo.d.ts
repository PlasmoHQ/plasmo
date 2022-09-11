declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: "development" | "production"

    PLASMO_BROWSER:
      | "arc"
      | "brave"
      | "chrome"
      | "chromium"
      | "edge"
      | "firefox"
      | "island"
      | "opera"
      | "plasmo"
      | "safari"
      | "sigmaos"
      | "tor"
      | "vivaldi"
      | "waterfox"
      | "yandex"

    PLASMO_MANIFEST_VERSION: "mv2" | "mv3"

    PLASMO_TARGET:
      | `${ProcessEnv["PLASMO_BROWSER"]}-${ProcessEnv["PLASMO_MANIFEST_VERSION"]}`
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
