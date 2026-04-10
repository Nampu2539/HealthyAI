import { BASE_URL } from "../config/api"

export function startKeepAlive() {
  fetch(`${BASE_URL}/`).catch(() => {})
  setInterval(() => {
    fetch(`${BASE_URL}/`).catch(() => {})
  }, 10 * 60 * 1000)
}