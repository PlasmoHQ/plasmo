// See https://www.plasmo.com/engineering/log/2022.04#update-2022.04.23
import type { ManifestContentScript } from "@plasmo/constants/manifest/content-script"

export type PlasmoContentScript = Omit<Partial<ManifestContentScript>, "js">

type Async<T> = Promise<T> | T

type Getter<T, P = any> = (props?: P) => Async<T>

type GetHtmlElement = Getter<HTMLElement>

export type PlasmoCSUIAnchor = {
  element: Element
  type: "overlay" | "inline"
}

export type PlasmoGetRootContainer = Getter<HTMLElement, PlasmoCSUIAnchor>

export type PlasmoGetOverlayAnchor = GetHtmlElement
export type PlasmoGetOverlayAnchorList = Getter<NodeList>

export type PlasmoGetInlineAnchor = GetHtmlElement
export type PlasmoGetInlineAnchorList = Getter<NodeList>

export type PlasmoCSUIMountState = {
  document: Document
  observer: MutationObserver | null

  isMounting: boolean
  isMutated: boolean
  /**
   * Used to quickly check if element is already mounted
   */
  hostSet: Set<Element>

  /**
   * Used to add more metadata to the host Set
   */
  hostMap: WeakMap<Element, PlasmoCSUIAnchor>
}

export type PlasmoMountShadowHost = (props: {
  observer: MutationObserver | null
  shadowHost: Element
  anchor: PlasmoCSUIAnchor
}) => Async<void>

export type PlasmoRender<PT = any> = (
  createRootContainer?: PlasmoGetRootContainer,
  MountContainer?: (_props: PT) => JSX.Element | HTMLElement,
  anchor?: PlasmoCSUIAnchor
) => Async<void>

export type PlasmoGetShadowHostId = Getter<string, PlasmoCSUIAnchor>

export type PlasmoGetStyle = Getter<HTMLStyleElement, PlasmoCSUIAnchor>

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
  getOverlayAnchorList: PlasmoGetOverlayAnchorList

  getInlineAnchor: PlasmoGetInlineAnchor
  getInlineAnchorList: PlasmoGetInlineAnchorList

  getRootContainer: PlasmoGetRootContainer

  createShadowRoot: PlasmoCreateShadowRoot
  watchOverlayAnchor: PlasmoWatchOverlayAnchor
  mountShadowHost: PlasmoMountShadowHost
  render: PlasmoRender
}
