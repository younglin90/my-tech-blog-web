// Cloudflare Pages Function: Umami 이벤트 집계 프록시
// 엔드포인트: GET /api/events?name=read-progress&limit=20
//
// 사용 예:
//   /api/events?name=share                   → 공유 이벤트 빈도 Top
//   /api/events?name=search-no-results       → 콘텐츠 갭 (검색했는데 결과 없는 쿼리)
//   /api/events?name=read-progress           → 25/50/75/100% 도달 분포
//   /api/events?name=language-switch         → 언어 전환 흐름
//
// 시크릿: UMAMI_API_KEY (Cloudflare Pages Settings → Environment variables)

interface Env {
  UMAMI_API_URL?: string
  UMAMI_API_KEY?: string
  UMAMI_WEBSITE_ID?: string
}

const DEFAULT_UMAMI_API_URL = 'https://api.umami.is/v1'
const DEFAULT_UMAMI_WEBSITE_ID = 'ef0b4cb2-34b1-4d5e-a70e-26a543816b22'

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const UMAMI_API_URL = env.UMAMI_API_URL || DEFAULT_UMAMI_API_URL
  const UMAMI_WEBSITE_ID = env.UMAMI_WEBSITE_ID || DEFAULT_UMAMI_WEBSITE_ID
  const UMAMI_API_KEY = env.UMAMI_API_KEY

  const json = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=900',
        ...(init.headers || {}),
      },
    })

  if (!UMAMI_API_KEY) {
    return json({ events: [], error: 'api-key-missing' }, { status: 503 })
  }

  const url = new URL(request.url)
  const eventName = url.searchParams.get('name') ?? ''
  const limit = parseInt(url.searchParams.get('limit') ?? '20', 10)
  // 최근 30일
  const endAt = Date.now()
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000

  const base = UMAMI_API_URL.replace(/\/$/, '')
  // Umami events endpoint:
  //   GET /websites/{id}/events/series?startAt=...&endAt=...&unit=day&timezone=UTC&type=event
  // 또는 events/values for distinct values
  const apiUrl = `${base}/websites/${UMAMI_WEBSITE_ID}/events/series?startAt=${startAt}&endAt=${endAt}&unit=day&timezone=UTC`
    + (eventName ? `&filter=${encodeURIComponent(eventName)}` : '')

  try {
    const res = await fetch(apiUrl, {
      headers: { 'x-umami-api-key': UMAMI_API_KEY, Accept: 'application/json' },
    })
    if (!res.ok) {
      return json({ events: [], error: `upstream-${res.status}` }, { status: 502 })
    }
    const data = await res.json()
    return json({ name: eventName, limit, data })
  } catch {
    return json({ events: [], error: 'fetch-failed' }, { status: 500 })
  }
}
