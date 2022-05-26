import { newTabToDocs } from "./popup"

describe("new tab to docs", () => {
  it("should have called the chrome tabs create api", () => {
    newTabToDocs()
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: "https://docs.plasmo.com/"
    })
  })
  it("should have called the chrome tabs create api three times", () => {
    newTabToDocs()
    newTabToDocs()
    expect(chrome.tabs.create).toHaveBeenCalledTimes(3)
  })
})
