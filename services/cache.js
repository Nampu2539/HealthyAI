const cache = {}

export async function fetchWithCache(url, ttl = 120000) {
  const now = Date.now()
  if (cache[url] && now - cache[url].time < ttl) {
    return cache[url].data
  }
  const res = await fetch(url)
  const data = await res.json()
  cache[url] = { data, time: now }
  return data
}

export function clearCache(url) {
  if (url) delete cache[url]
  else Object.keys(cache).forEach(k => delete cache[k])
}