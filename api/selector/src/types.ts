export type SelectorMessage = {
  name: "plasmo:selector:invalid"
  payload: {
    selectors: string[]
    url: string
  }
}
