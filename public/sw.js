/* sw.js — 가벼운 PWA Service Worker (Workbox 미사용, 직접 작성)
 * 전략:
 *   - 정적 자산(_next/static, /katex, /favicon.* 등): cache-first
 *   - 페이지(HTML): stale-while-revalidate
 *   - API/RSS/Sitemap: network-first (실패 시 캐시 폴백)
 *   - middleware redirect 동작에 영향 없도록 fetch 그대로 통과시킬 것은 통과
 */

const CACHE_VERSION = 'v1'
const CACHE_STATIC = `static-${CACHE_VERSION}`
const CACHE_PAGES = `pages-${CACHE_VERSION}`

// install: 핵심 자산 미리 캐시 (오프라인 fallback용)
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
      await Promise.all(keys.filter((k) => !k.endsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
      await self.clients.claim()
    })(),
  )
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

  // Static — cache-first
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

  // API/RSS — network-first
  if (isApiOrFeed(url)) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone()
        caches.open(CACHE_PAGES).then((c) => c.put(req, copy))
        return res
      }).catch(() => caches.match(req).then((m) => m || new Response('offline', { status: 503 }))),
    )
    return
  }

  // HTML 페이지 — stale-while-revalidate
  if (req.destination === 'document' || req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      caches.open(CACHE_PAGES).then(async (c) => {
        const hit = await c.match(req)
        const fetchPromise = fetch(req).then((res) => {
          if (res.ok) c.put(req, res.clone())
          return res
        }).catch(() => hit || new Response('offline', { status: 503, headers: { 'Content-Type': 'text/html' } }))
        return hit || fetchPromise
      }),
    )
  }
})
