// See https://www.plasmo.com/engineering/log/2022.04#update-2022.04.23
import type { ManifestContentScript } from "@plasmo/constants/manifest/content-script"

export type PlasmoContentScript = Omit<Partial<ManifestContentScript>, "js">

type GetT<T = HTMLElement> = () => T | Promise<T>

export type PlasmoGetRootContainer = GetT

export type PlasmoGetOverlayAnchor = GetT
export type PlasmoGetInlineAnchor = () => HTMLElement | null

export type PlasmoCSUIMountState = {
  document: Document
  observer: MutationObserver | null
  shadowHost: Element | null
  inlineAnchor: Element | null
}

export type PlasmoMountShadowHost = (
  mountState: PlasmoCSUIMountState
) => Promise<void> | void

export type PlasmoRender = (
  createRootContainer: GetT,
  MountContainer: () => JSX.Element
) => Promise<void> | void

export type PlasmoGetShadowHostId = GetT<string>

export type PlasmoGetStyle = GetT<HTMLStyleElement>

export type PlasmoCSUI = {
  default: any
  getStyle: PlasmoGetStyle
  getShadowHostId: PlasmoGetShadowHostId

  getOverlayAnchor: PlasmoGetOverlayAnchor
  getInlineAnchor: PlasmoGetInlineAnchor

  getRootContainer: PlasmoGetRootContainer
  mountShadowHost: PlasmoMountShadowHost
  render: PlasmoRender
}
