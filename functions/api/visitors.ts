// Cloudflare Pages Function: 방문자·페이지뷰 조회
// 엔드포인트: GET /api/visitors
//
// 응답: { today: {visitors,pageviews}, yesterday: {...}, total: {...},
//         visitors, pageviews }   ← 마지막 두 개는 구버전 클라이언트 호환(=today)
//
// 데이터: /stats/api/send 가 D1(바인딩명 DB)의 visit_daily 에 KST 일 단위로 집계한 값.
// (Umami 통계 API는 Pro 플랜 전용이라 쓰지 않는다.)
// 실패해도 200 + error 로 응답 — 5xx는 "Bad gateway" 페이지에 가려 사유를 볼 수 없다.

interface D1Database {
  prepare(sql: string): { bind(...values: unknown[]): { all<T>(): Promise<{ results: T[] }> } }
}
interface Env {
  DB?: D1Database
}

interface WindowStats {
  visitors: number | null
  pageviews: number | null
}

const DAY_MS = 24 * 60 * 60 * 1000
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const { env } = context
  const json = (body: unknown, cache: string) =>
    new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
    })
  const empty: WindowStats = { visitors: null, pageviews: null }
  const fail = (error: string) =>
    json({ today: empty, yesterday: empty, total: empty, visitors: null, pageviews: null, error }, 'no-store')

  if (!env.DB) return fail('db-binding-missing')

  const kstNow = Date.now() + KST_OFFSET_MS
  const today = new Date(kstNow).toISOString().slice(0, 10)
  const yesterday = new Date(kstNow - DAY_MS).toISOString().slice(0, 10)

  let rows: { day: string; visitors: number; pageviews: number }[] = []
  let totals = { visitors: 0, pageviews: 0 }
  try {
    const [d, t] = await Promise.all([
      env.DB.prepare('SELECT day, visitors, pageviews FROM visit_daily WHERE day IN (?, ?)')
        .bind(today, yesterday)
        .all<{ day: string; visitors: number; pageviews: number }>(),
      env.DB.prepare('SELECT COALESCE(SUM(visitors), 0) AS visitors, COALESCE(SUM(pageviews), 0) AS pageviews FROM visit_daily')
        .bind()
        .all<{ visitors: number; pageviews: number }>(),
    ])
    rows = d.results
    totals = t.results[0] ?? totals
  } catch (e) {
    // 첫 페이지뷰가 기록되기 전엔 테이블이 없다 → 0으로 표시
    if (!String(e).includes('no such table')) return fail('db-error')
  }

  const pick = (day: string): WindowStats => {
    const r = rows.find((x) => x.day === day)
    return { visitors: r?.visitors ?? 0, pageviews: r?.pageviews ?? 0 }
  }
  const todayStats = pick(today)
  return json(
    {
      today: todayStats,
      yesterday: pick(yesterday),
      total: totals,
      visitors: todayStats.visitors,
      pageviews: todayStats.pageviews,
    },
    'public, max-age=60',
  )
}
