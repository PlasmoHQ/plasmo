export const createLoadingIndicator = () => {
  // TODO: Turn this into a fine SVG animation instead of a green square
  const loading = document.createElement("div")
  loading.id = "plasmo-loading"

  loading.style.pointerEvents = "none"

  loading.style.position = "fixed"
  loading.style.bottom = "47px"
  loading.style.right = "47px"

  loading.style.width = "74px"
  loading.style.height = "74px"

  loading.style.background = "green"

  loading.style.opacity = "0"
  loading.style.transition = "opacity 1.47s ease-in-out"

  return {
    element: loading,
    show: () => {
      loading.style.opacity = "1"
    },
    hide: () => {
      loading.style.opacity = "0"
    }
  }
}
