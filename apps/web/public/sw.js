const VERSION = 'crustulator-v1'
const SHELL = ['/', '/recipes', '/offline.html']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

async function fromNetwork(request) {
  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(VERSION)
    cache.put(request, response.clone())
  }
  return response
}

async function page(request) {
  try {
    return await fromNetwork(request)
  } catch {
    return (await caches.match(request)) ?? (await caches.match('/')) ?? (await caches.match('/offline.html'))
  }
}

async function asset(request) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    return await fromNetwork(request)
  } catch {
    return Response.error()
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return
  event.respondWith(request.mode === 'navigate' ? page(request) : asset(request))
})
