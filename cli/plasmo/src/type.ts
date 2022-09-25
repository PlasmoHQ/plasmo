// See https://www.plasmo.com/engineering/log/2022.04#update-2022.04.23
import type { ManifestContentScript } from "@plasmo/constants/manifest/content-script"

export type PlasmoContentScript = Omit<Partial<ManifestContentScript>, "js">

type Async<T> = Promise<T> | T

type Getter<T> = () => Async<T>

type GetHtmlElement = Getter<HTMLElement>

export type PlasmoGetRootContainer = GetHtmlElement
export type PlasmoGetOverlayAnchor = GetHtmlElement

export type PlasmoGetInlineAnchor = () => HTMLElement | null

export type PlasmoCSUIMountState = {
  document: Document
  observer: MutationObserver | null
  shadowHost: Element | null
  inlineAnchor: Element | null
}

export type PlasmoMountShadowHost = (
  mountState: PlasmoCSUIMountState
) => Async<void>

export type PlasmoRender = (
  createRootContainer: GetHtmlElement,
  MountContainer: () => JSX.Element | HTMLElement
) => Async<void>

export type PlasmoGetShadowHostId = Getter<string>

export type PlasmoGetStyle = Getter<HTMLStyleElement>

export type PlasmoWatchOverlayAnchor = (
  updatePosition: () => Promise<void>
) => void

export type PlasmoCreateShadowRoot = (
  shadowHost: HTMLDivElement
) => Async<ShadowRoot>

export type PlasmoCSUI = {
  default: any
  getStyle: PlasmoGetStyle
  getShadowHostId: PlasmoGetShadowHostId

  getOverlayAnchor: PlasmoGetOverlayAnchor
  getInlineAnchor: PlasmoGetInlineAnchor

  getRootContainer: PlasmoGetRootContainer

  createShadowRoot: PlasmoCreateShadowRoot
  watchOverlayAnchor: PlasmoWatchOverlayAnchor
  mountShadowHost: PlasmoMountShadowHost
  render: PlasmoRender
}
