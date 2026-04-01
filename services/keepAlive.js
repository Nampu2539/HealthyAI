const BACKEND_URL = "https://healthy-ai.onrender.com"

export function startKeepAlive() {
  fetch(`${BACKEND_URL}/`).catch(() => {})
  setInterval(() => {
    fetch(`${BACKEND_URL}/`).catch(() => {})
  }, 10 * 60 * 1000)
}