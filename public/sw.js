/* sw.js — 가벼운 PWA Service Worker (Workbox 미사용, 직접 작성)
 * 전략:
 *   - 정적 자산(_next/static, /katex, /favicon.* 등): cache-first (해시 포함, 안전)
 *   - 페이지(HTML): network-first (실패 시 캐시 폴백)
 *     ↳ stale-while-revalidate를 쓰면 새 포스트가 1회차 방문에서 안 보인다.
 *   - API/RSS/Sitemap: network-first (실패 시 캐시 폴백)
 *
 * CACHE_VERSION 갱신 시 activate에서 구 버전 전부 삭제 → 사용자 캐시 자동 정리.
 */

const CACHE_VERSION = 'v3'
const CACHE_STATIC = `static-${CACHE_VERSION}`
const CACHE_PAGES = `pages-${CACHE_VERSION}`

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

  // HTML 페이지 — network-first (오프라인일 때만 캐시 폴백)
  if (req.destination === 'document' || req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      (async () => {
        try {
          const res = await fetch(req)
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE_PAGES).then((c) => c.put(req, copy))
          }
          return res
        } catch {
          const cached = await caches.match(req)
          return cached || new Response('offline', { status: 503, headers: { 'Content-Type': 'text/html' } })
        }
      })(),
    )
  }
})
