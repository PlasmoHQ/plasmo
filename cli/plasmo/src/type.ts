// See https://www.plasmo.com/engineering/log/2022.04#update-2022.04.23
import type { ManifestContentScript } from "@plasmo/constants/manifest/content-script"

export type PlasmoContentScript = Omit<Partial<ManifestContentScript>, "js">

export type PlasmoGetMountPoint = () => Promise<HTMLElement> | HTMLElement

export type PlasmoGetRootContainer = () => Promise<HTMLElement> | HTMLElement

export type PlasmoMountShadowHost = (
  _shadowHost: HTMLDivElement
) => Promise<void> | void
