let loadingInterval: NodeJS.Timeout | null = null
let isLoading = false

export const startLoading = () => {
  if (isLoading) return
  isLoading = true
  let dots = 0
  const baseString = "🔄 Building"
  process.stdout.write(baseString)
  loadingInterval = setInterval(() => {
    dots = (dots + 1) % 4
    let dotString = dots === 0 ? "   " : ".".repeat(dots)
    process.stdout.write(`\r${baseString}${dotString}`)
  }, 400)
}

export const stopLoading = () => {
  if (!isLoading) return
  isLoading = false
  if (loadingInterval) {
    clearInterval(loadingInterval)
    loadingInterval = null
  }
  // Clear the loading text
  process.stdout.write("\r" + " ".repeat(20) + "\r")
}
