export type { PlasmoMessaging, EventName, Metadata } from "./types"

export type OriginContext =
  | "background"
  | "extension-page"
  | "sandbox-page"
  | "content-script"
  | "window"
