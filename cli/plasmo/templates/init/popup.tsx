export const newTabToDocs = () =>
  chrome.tabs.create({
    url: "https://docs.plasmo.com/"
  })

function IndexPopup() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 16
      }}>
      <h1>
        Welcome to your <a href="https://www.plasmo.com">Plasmo</a> Extension!
      </h1>
      <button onClick={newTabToDocs}>Go to Plasmo Docs</button>
    </div>
  )
}

export default IndexPopup
