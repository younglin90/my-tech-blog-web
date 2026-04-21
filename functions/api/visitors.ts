// Cloudflare Pages Function: Umami 일일 방문자·페이지뷰 프록시
// 엔드포인트: GET /api/visitors
//
// 필요 환경변수 (Cloudflare Pages → Settings → Environment variables):
//   UMAMI_API_URL       예) https://api.umami.is/v1   또는  self-host URL + /api
//   UMAMI_API_KEY       Umami Cloud: Profile → API 키 발급
//   UMAMI_WEBSITE_ID    Umami 사이트 설정의 Website ID (UUID)
//
// 응답 예시: { "visitors": 42, "pageviews": 128 }

interface Env {
  UMAMI_API_URL: string
  UMAMI_API_KEY: string
  UMAMI_WEBSITE_ID: string
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const { UMAMI_API_URL, UMAMI_API_KEY, UMAMI_WEBSITE_ID } = env
  const json = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        ...(init.headers || {}),
      },
    })

  if (!UMAMI_API_URL || !UMAMI_API_KEY || !UMAMI_WEBSITE_ID) {
    return json({ visitors: null, pageviews: null, error: 'env-missing' }, { status: 503 })
  }

  const now = Date.now()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const startAt = startOfDay.getTime()

  const base = UMAMI_API_URL.replace(/\/$/, '')
  const url = `${base}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAt}&endAt=${now}`

  try {
    const res = await fetch(url, {
      headers: {
        'x-umami-api-key': UMAMI_API_KEY,
        Accept: 'application/json',
      },
      cf: { cacheTtl: 300, cacheEverything: true },
    })
    if (!res.ok) {
      return json({ visitors: null, pageviews: null, error: `upstream-${res.status}` }, { status: 502 })
    }
    const data = (await res.json()) as {
      visitors?: { value: number }
      pageviews?: { value: number }
    }
    return json({
      visitors: data.visitors?.value ?? 0,
      pageviews: data.pageviews?.value ?? 0,
    })
  } catch {
    return json({ visitors: null, pageviews: null, error: 'fetch-failed' }, { status: 500 })
  }
}
