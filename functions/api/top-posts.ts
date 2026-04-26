// Cloudflare Pages Function: Umami "지난 7일 인기 페이지 top N" 프록시
// 엔드포인트: GET /api/top-posts?limit=5&days=7
//
// Umami metrics 응답을 받아 [{url, label, views}] 로 단순화.
// /posts/ 경로만 필터링 (홈·tag·about 등 제외).

interface Env {
  UMAMI_API_URL?: string
  UMAMI_API_KEY?: string
  UMAMI_WEBSITE_ID?: string
}

const DEFAULT_UMAMI_API_URL = 'https://api.umami.is/v1'
const DEFAULT_UMAMI_WEBSITE_ID = 'ef0b4cb2-34b1-4d5e-a70e-26a543816b22'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const url = new URL(request.url)
  const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get('limit') || '5', 10)))
  const days = Math.min(30, Math.max(1, parseInt(url.searchParams.get('days') || '7', 10)))
  const debug = url.searchParams.get('debug') === '1'

  const UMAMI_API_URL = env.UMAMI_API_URL || DEFAULT_UMAMI_API_URL
  const UMAMI_WEBSITE_ID = env.UMAMI_WEBSITE_ID || DEFAULT_UMAMI_WEBSITE_ID
  const UMAMI_API_KEY = env.UMAMI_API_KEY

  const json = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': debug ? 'no-store' : 'public, max-age=300, s-maxage=900',
        ...(init.headers || {}),
      },
    })

  if (!UMAMI_API_KEY) {
    return json({ items: [], error: 'api-key-missing' }, { status: 503 })
  }

  const now = Date.now()
  const startAt = now - days * 24 * 60 * 60 * 1000
  const base = UMAMI_API_URL.replace(/\/$/, '')
  // type=url returns [{x: '/path', y: count}, ...]
  const apiUrl = `${base}/websites/${UMAMI_WEBSITE_ID}/metrics?type=url&startAt=${startAt}&endAt=${now}&limit=200`

  try {
    const res = await fetch(apiUrl, {
      headers: { 'x-umami-api-key': UMAMI_API_KEY, Accept: 'application/json' },
    })
    const raw = await res.text()
    if (!res.ok) {
      return json({ items: [], error: `upstream-${res.status}`, ...(debug && { raw, url: apiUrl }) }, { status: 502 })
    }
    let data: Array<{ x?: string; y?: number }> = []
    try { data = JSON.parse(raw) } catch { /* keep empty */ }

    // /posts/ 만, 같은 슬러그(다른 locale)면 합산
    const acc = new Map<string, number>()
    for (const row of data) {
      const path = (row.x || '').replace(/[?#].*$/, '').replace(/\/$/, '')
      const m = path.match(/^\/(?:ko|en|ja|zh|es)\/posts\/([^/]+)$/)
      if (!m) continue
      const slug = m[1]
      acc.set(slug, (acc.get(slug) || 0) + (row.y || 0))
    }
    const items = Array.from(acc.entries())
      .map(([slug, views]) => ({ slug, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit)

    return json({ items, days, ...(debug && { raw_count: data.length }) })
  } catch (e) {
    return json({ items: [], error: 'fetch-failed', ...(debug && { exception: String(e) }) }, { status: 500 })
  }
}
