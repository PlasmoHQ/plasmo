import { useState } from "react"

function IndexPopup() {
  const [data, setData] = useState("")

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
        <input onChange={(e)=> setData(e.target.value)} value={data}/>
    </div>
  )
}

export default IndexPopup
