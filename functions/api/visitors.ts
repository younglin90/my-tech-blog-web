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

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  const { env, request } = context
  const UMAMI_API_URL = env.UMAMI_API_URL || DEFAULT_UMAMI_API_URL
  const UMAMI_WEBSITE_ID = env.UMAMI_WEBSITE_ID || DEFAULT_UMAMI_WEBSITE_ID
  const UMAMI_API_KEY = env.UMAMI_API_KEY
  const debug = new URL(request.url).searchParams.get('debug') === '1'
  const json = (body: unknown, init: ResponseInit = {}) =>
    new Response(JSON.stringify(body), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': debug ? 'no-store' : 'public, max-age=60, s-maxage=300',
        ...(init.headers || {}),
      },
    })

  if (!UMAMI_API_KEY) {
    return json({ visitors: null, pageviews: null, error: 'api-key-missing' }, { status: 503 })
  }

  // 24시간 슬라이딩 윈도우 (자정 경계로 0이 되는 문제 회피).
  const DAY_MS = 24 * 60 * 60 * 1000
  const now = Date.now()
  const startAt = now - DAY_MS

  const base = UMAMI_API_URL.replace(/\/$/, '')
  const url = `${base}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAt}&endAt=${now}`

  try {
    const res = await fetch(url, {
      headers: {
        'x-umami-api-key': UMAMI_API_KEY,
        Accept: 'application/json',
      },
    })
    const raw = await res.text()
    if (!res.ok) {
      return json({
        visitors: null,
        pageviews: null,
        error: `upstream-${res.status}`,
        ...(debug && { raw, url }),
      }, { status: 502 })
    }
    let data: unknown = {}
    try { data = JSON.parse(raw) } catch { /* keep empty */ }

    // Umami stats 응답 가능 형태:
    //   {visitors:{value,prev}, pageviews:{value,prev}, ...}  ← Cloud v1 표준
    //   {visitors:N, pageviews:N}                              ← 일부 self-host 변형
    const pickNum = (v: unknown): number => {
      if (typeof v === 'number') return v
      if (v && typeof v === 'object' && 'value' in (v as object)) {
        const n = (v as { value: unknown }).value
        return typeof n === 'number' ? n : 0
      }
      return 0
    }
    const d = data as Record<string, unknown>
    const out = {
      visitors: pickNum(d.visitors),
      pageviews: pickNum(d.pageviews),
      ...(debug && { raw_response: data, url, startAt, endAt: now }),
    }
    return json(out)
  } catch (e) {
    return json({
      visitors: null,
      pageviews: null,
      error: 'fetch-failed',
      ...(debug && { exception: String(e) }),
    }, { status: 500 })
  }
}
