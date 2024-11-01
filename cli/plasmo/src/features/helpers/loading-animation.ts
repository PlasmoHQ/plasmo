const LOADING_TEXT = "🔄 Building"
const state = {
  loadingInterval: null as NodeJS.Timeout | null,
  isLoading: false,
  dotCount: 0
}

export const startLoading = () => {
  if (state.isLoading) {
    return
  }
  state.isLoading = true
  process.stdout.write(LOADING_TEXT)
  state.loadingInterval = setInterval(() => {
    state.dotCount = (state.dotCount + 1) % 4
    let dotString = state.dotCount === 0 ? "   " : ".".repeat(state.dotCount)
    process.stdout.write(`\r${LOADING_TEXT}${dotString}`)
  }, 400)
}

export const stopLoading = () => {
  if (!state.isLoading) {
    return
  }
  state.isLoading = false
  if (state.loadingInterval) {
    clearInterval(state.loadingInterval)
    state.loadingInterval = null
  }
  // Clear the loading text
  process.stdout.write("\r" + " ".repeat(20) + "\r")
}
