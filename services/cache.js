const cache = {}

export async function fetchWithCache(url, ttl = 60000) {
  const now = Date.now()
  
  if (cache[url] && now - cache[url].time < ttl) {
    return cache[url].data
  }
  
  const res = await fetch(url)
  const data = await res.json()
  cache[url] = { data, time: now }
  return data
}