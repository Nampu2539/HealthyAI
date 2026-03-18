const BACKEND_URL = "https://healthy-ai.onrender.com"

export function startKeepAlive() {
  // ping ทันทีตอนเปิดแอป
  fetch(`${BACKEND_URL}/`).catch(() => {})
  
  // ping ทุก 14 นาที ไม่ให้ Render หลับ
  setInterval(() => {
    fetch(`${BACKEND_URL}/`).catch(() => {})
  }, 14 * 60 * 1000)
}