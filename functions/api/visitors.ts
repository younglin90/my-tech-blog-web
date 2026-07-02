// Cloudflare Pages Function: Umami 방문자·페이지뷰 프록시
// 엔드포인트: GET /api/visitors
//
// 응답: { today: {visitors,pageviews}, yesterday: {...}, total: {...},
//         visitors, pageviews }   ← 마지막 두 개는 구버전 클라이언트 호환(=today)
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

interface WindowStats {
  visitors: number | null
  pageviews: number | null
}

const DEFAULT_UMAMI_API_URL = 'https://api.umami.is/v1'
const DEFAULT_UMAMI_WEBSITE_ID = 'ef0b4cb2-34b1-4d5e-a70e-26a543816b22'

// 사이트 오픈 이전이면 충분한 하한 — "전체" 윈도우의 startAt (2026-01-01 UTC)
const SITE_EPOCH_MS = Date.UTC(2026, 0, 1)

// Umami stats 응답 가능 형태:
//   {visitors:{value,prev}, pageviews:{value,prev}, ...}  ← Cloud v1 표준
//   {visitors:N, pageviews:N}                              ← 일부 self-host 변형
function pickNum(v: unknown): number {
  if (typeof v === 'number') return v
  if (v && typeof v === 'object' && 'value' in (v as object)) {
    const n = (v as { value: unknown }).value
    return typeof n === 'number' ? n : 0
  }
  return 0
}

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

  // "오늘/어제"는 블로그 주 독자 기준인 KST(UTC+9, DST 없음) 자정 경계로 계산.
  const DAY_MS = 24 * 60 * 60 * 1000
  const KST_OFFSET_MS = 9 * 60 * 60 * 1000
  const now = Date.now()
  const todayStart = Math.floor((now + KST_OFFSET_MS) / DAY_MS) * DAY_MS - KST_OFFSET_MS
  const yesterdayStart = todayStart - DAY_MS

  const base = UMAMI_API_URL.replace(/\/$/, '')

  const fetchWindow = async (startAt: number, endAt: number): Promise<WindowStats & { raw?: unknown }> => {
    const url = `${base}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`
    try {
      const res = await fetch(url, {
        headers: {
          'x-umami-api-key': UMAMI_API_KEY,
          Accept: 'application/json',
        },
      })
      if (!res.ok) return { visitors: null, pageviews: null, ...(debug && { raw: `upstream-${res.status}` }) }
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>
      return {
        visitors: pickNum(data.visitors),
        pageviews: pickNum(data.pageviews),
        ...(debug && { raw: data }),
      }
    } catch (e) {
      return { visitors: null, pageviews: null, ...(debug && { raw: String(e) }) }
    }
  }

  const [today, yesterday, total] = await Promise.all([
    fetchWindow(todayStart, now),
    fetchWindow(yesterdayStart, todayStart - 1),
    fetchWindow(SITE_EPOCH_MS, now),
  ])

  const allFailed = [today, yesterday, total].every((w) => w.visitors === null)
  if (allFailed) {
    return json({
      today, yesterday, total,
      visitors: null, pageviews: null,
      error: 'upstream-failed',
      ...(debug && { todayStart, yesterdayStart }),
    }, { status: 502 })
  }

  return json({
    today,
    yesterday,
    total,
    // 구버전 클라이언트(24h 표시) 호환 필드 — 오늘 수치로 대체
    visitors: today.visitors,
    pageviews: today.pageviews,
    ...(debug && { todayStart, yesterdayStart, now }),
  })
}
