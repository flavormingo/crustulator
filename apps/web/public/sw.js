const VERSION = 'crustulator-2'
const SHELL = ['/', '/offline.html']
const LIMIT = 80

async function trim(cache) {
  const keys = await cache.keys()
  if (keys.length <= LIMIT) return
  for (const key of keys.slice(0, keys.length - LIMIT)) await cache.delete(key)
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

async function store(request, response) {
  if (!response.ok) return
  const cache = await caches.open(VERSION)
  await cache.put(request, response.clone())
  await trim(cache)
}

async function page(event) {
  const url = new URL(event.request.url)
  const key = url.origin + url.pathname
  try {
    const response = await fetch(event.request)
    if (!url.search) event.waitUntil(store(key, response.clone()).catch(() => {}))
    return response
  } catch {
    return (await caches.match(key)) ?? (await caches.match('/offline.html')) ?? Response.error()
  }
}

async function asset(event) {
  const cached = await caches.match(event.request)
  if (cached) return cached
  try {
    const response = await fetch(event.request)
    event.waitUntil(store(event.request, response.clone()).catch(() => {}))
    return response
  } catch {
    return Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith(request.mode === 'navigate' ? page(event) : asset(event))
})
