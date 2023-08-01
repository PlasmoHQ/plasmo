import type { ManifestContentScript } from "@plasmo/constants/manifest/content-script"

// See https://www.plasmo.com/engineering/log/2022.04#update-2022.04.23
export type PlasmoCSConfig = Omit<Partial<ManifestContentScript>, "js">

/**
 * @deprecated use **PlasmoCSConfig** instead
 */
export type PlasmoContentScript = PlasmoCSConfig

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

  mountInterval: NodeJS.Timer | null

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
    mountState?: PlasmoCSUIMountState
    shadowHost: Element
  } & PlasmoCSUIProps
) => Async<void>

export type PlasmoGetShadowHostId = Getter<string, PlasmoCSUIAnchor>

export type PlasmoGetStyle = Getter<
  HTMLStyleElement,
  PlasmoCSUIAnchor & { sfcStyleContent?: string }
>

export type PlasmoGetSfcStyleContent = Getter<string>

/**
 * @return a cleanup unwatch function that will be run when unmounted
 */
export type PlasmoWatchOverlayAnchor = (
  updatePosition: () => Promise<void>
) => (() => void) | void

export type PlasmoCSUIContainerProps = {
  id?: string
  children?: React.ReactNode
  watchOverlayAnchor?: PlasmoWatchOverlayAnchor
} & PlasmoCSUIProps

export type PlasmoCSUIJSXContainer = (
  p?: PlasmoCSUIContainerProps
) => JSX.Element
export type PlasmoCSUIHTMLContainer = (
  p?: PlasmoCSUIContainerProps
) => HTMLElement

export type PlasmoCreateShadowRoot = (
  shadowHost: HTMLElement
) => Async<ShadowRoot>

export type PlasmoRender<T> = (
  props: {
    createRootContainer?: (p?: PlasmoCSUIAnchor) => Async<Element>
  } & PlasmoCSUIProps,
  InlineCSUIContainer?: T,
  OverlayCSUIContainer?: T
) => Async<void>

export type PlasmoCSUIWatch = (props: {
  render: (anchor: PlasmoCSUIAnchor) => Async<void>
  observer: {
    start: (render: (anchor?: PlasmoCSUIAnchor) => void) => void
    mountState: PlasmoCSUIMountState
  }
}) => void

export type PlasmoCSUI<T> = {
  default: any
  getStyle: PlasmoGetStyle
  getSfcStyleContent: PlasmoGetSfcStyleContent
  getShadowHostId: PlasmoGetShadowHostId

  getOverlayAnchor: PlasmoGetOverlayAnchor
  getOverlayAnchorList: PlasmoGetOverlayAnchorList

  getInlineAnchor: PlasmoGetInlineAnchor
  getInlineAnchorList: PlasmoGetInlineAnchorList

  getRootContainer: PlasmoGetRootContainer

  createShadowRoot: PlasmoCreateShadowRoot
  watchOverlayAnchor: PlasmoWatchOverlayAnchor
  mountShadowHost: PlasmoMountShadowHost

  render: PlasmoRender<T>

  watch: PlasmoCSUIWatch
}
