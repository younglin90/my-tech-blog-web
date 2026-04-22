// Cloudflare Pages Function: Umami 일일 방문자·페이지뷰 프록시
// 엔드포인트: GET /api/visitors
//
// 필수 시크릿 (Cloudflare Pages → Settings → Environment variables, Encrypt):
//   UMAMI_API_KEY       Umami Cloud: Profile → API keys 에서 발급
//
// 아래 두 값은 공개 정보이므로 기본값 하드코딩 (환경변수로 오버라이드 가능):
//   UMAMI_API_URL       (기본: https://api.umami.is/v1)
//   UMAMI_WEBSITE_ID    (기본: ef0b4cb2-34b1-4d5e-a70e-26a543816b22)

interface Env {
  UMAMI_API_URL?: string
  UMAMI_API_KEY?: string
  UMAMI_WEBSITE_ID?: string
}

const DEFAULT_UMAMI_API_URL = 'https://api.umami.is/v1'
const DEFAULT_UMAMI_WEBSITE_ID = 'ef0b4cb2-34b1-4d5e-a70e-26a543816b22'

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const { env } = context
  const UMAMI_API_URL = env.UMAMI_API_URL || DEFAULT_UMAMI_API_URL
  const UMAMI_WEBSITE_ID = env.UMAMI_WEBSITE_ID || DEFAULT_UMAMI_WEBSITE_ID
  const UMAMI_API_KEY = env.UMAMI_API_KEY
  const json = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        ...(init.headers || {}),
      },
    })

  if (!UMAMI_API_KEY) {
    return json({ visitors: null, pageviews: null, error: 'api-key-missing' }, { status: 503 })
  }

  // Cloudflare Workers는 UTC로 동작. 푸터 표시는 한국시간(KST, UTC+9) 기준으로
  // "오늘 00:00 ~ 현재"를 집계해서 Umami 대시보드(Asia/Seoul)와 동기화한다.
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000
  const DAY_MS = 24 * 60 * 60 * 1000
  const now = Date.now()
  const kstMidnightMs = Math.floor((now + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS
  const startAt = kstMidnightMs

  const base = UMAMI_API_URL.replace(/\/$/, '')
  const url = `${base}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAt}&endAt=${now}`

  try {
    const res = await fetch(url, {
      headers: {
        'x-umami-api-key': UMAMI_API_KEY,
        Accept: 'application/json',
      },
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
