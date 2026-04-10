import { BASE_URL } from "../config/api"

const cache = {}

export async function fetchWithCache(url, ttl = 120000) {
  const now = Date.now()
  if (cache[url] && now - cache[url].time < ttl) {
    return cache[url].data
  }
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`API Error: ${res.status} ${res.statusText}`)
  }
  const data = await res.json()
  cache[url] = { data, time: now }
  return data
}

export function clearCache(url) {
  if (url) delete cache[url]
  else Object.keys(cache).forEach(k => delete cache[k])
}