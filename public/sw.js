/* sw.js — lightweight PWA service worker.
 * Static hashed assets stay cache-first. HTML pages, generated indexes, feeds,
 * and sitemap are never stored by the SW, so newly deployed posts/tools are
 * visible immediately without asking users to clear browser cache.
 */

const CACHE_VERSION = 'v4'
const CACHE_STATIC = `static-${CACHE_VERSION}`

const PRECACHE = ['/icon-192.png', '/icon-512.png', '/favicon.ico', '/manifest.webmanifest']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_STATIC || k.startsWith('pages-'))
          .map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting()
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/katex/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/icon.svg' ||
    /^\/(icon-192|icon-512|apple-touch-icon)\.png$/.test(url.pathname)
  )
}

function isApiOrFeed(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.pathname === '/post-index.json' ||
    url.pathname === '/rag-index.json' ||
    url.pathname === '/sitemap.xml' ||
    url.pathname.startsWith('/sitemap/') ||
    /^\/feed(-(ko|en|ja|zh|es))?\.(xml|json)$/.test(url.pathname)
  )
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return

  // Static — cache-first (해시 URL이라 안전)
  if (isStaticAsset(url)) {
    e.respondWith(
      caches.open(CACHE_STATIC).then(async (c) => {
        const hit = await c.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok) c.put(req, res.clone())
        return res
      }),
    )
    return
  }

  // Generated content — always network. Do not populate stale page caches.
  if (isApiOrFeed(url)) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => new Response('offline', { status: 503 })),
    )
    return
  }

  // HTML pages — always network. Old pages-* caches are deleted on activate.
  if (req.destination === 'document' || req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).catch(
        () => new Response('offline', { status: 503, headers: { 'Content-Type': 'text/html' } }),
      ),
    )
  }
})
