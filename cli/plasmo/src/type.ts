// See https://www.plasmo.com/engineering/log/2022.04#update-2022.04.23
import type { ManifestContentScript } from "@plasmo/constants/manifest/content-script"

export type PlasmoContentScript = Omit<Partial<ManifestContentScript>, "js">

type Async<T> = Promise<T> | T

type Getter<T, P = any> = (props?: P) => Async<T>

type GetElement = Getter<Element>

export type PlasmoCSUIAnchor = {
  element: Element
  type: "overlay" | "inline"
}

export type PlasmoCSUIProps = {
  anchor?: PlasmoCSUIAnchor
}

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

  /**
   * Used to align overlay anchor with elements on the page
   */
  overlayTargetList: Element[]
}

export type PlasmoGetRootContainer = (
  props: {
    mountState?: PlasmoCSUIMountState
  } & PlasmoCSUIProps
) => Async<Element>

export type PlasmoGetOverlayAnchor = GetElement
export type PlasmoGetOverlayAnchorList = Getter<NodeList>

export type PlasmoGetInlineAnchor = GetElement
export type PlasmoGetInlineAnchorList = Getter<NodeList>

export type PlasmoMountShadowHost = (
  props: {
    observer: MutationObserver | null
    shadowHost: Element
  } & PlasmoCSUIProps
) => Async<void>

export type PlasmoGetShadowHostId = Getter<string, PlasmoCSUIAnchor>

export type PlasmoGetStyle = Getter<HTMLStyleElement, PlasmoCSUIAnchor>

/**
 * @return a cleanup unwatch function that will be run when unmounted
 */
export type PlasmoWatchOverlayAnchor = (
  updatePosition: () => Promise<void>
) => () => void

export type PlasmoCSUIContainerProps = {
  id?: string
  children?: React.ReactNode
  watchOverlayAnchor?: PlasmoWatchOverlayAnchor
} & PlasmoCSUIProps

export type PlasmoCSUIContainer = (
  p: PlasmoCSUIContainerProps
) => JSX.Element | Element

export type PlasmoCreateShadowRoot = (
  shadowHost: HTMLElement
) => Async<ShadowRoot>

export type PlasmoRender = (
  props: {
    createRootContainer?: (p: PlasmoCSUIAnchor) => Async<Element>
  } & PlasmoCSUIProps,
  InlineCSUIContainer?: PlasmoCSUIContainer,
  OverlayCSUIContainer?: PlasmoCSUIContainer
) => Async<void>

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
