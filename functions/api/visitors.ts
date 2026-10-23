// Cloudflare Pages Function: 방문자·페이지뷰 조회
// 엔드포인트: GET /api/visitors
//
// 응답: { today: {visitors,pageviews}, yesterday: {...}, total: {...},
//         visitors, pageviews }   ← 마지막 두 개는 구버전 클라이언트 호환(=today)
//
// 데이터: /api/pageview 가 D1(바인딩명 DB)에 KST 일 단위로 집계한 값. 읽기는 3행 고정.
// 실패해도 200 + error 로 응답 — 5xx는 "Bad gateway" 페이지에 가려 사유를 볼 수 없다.

import { clientIp, edgeCached, ensureSchema, json, kstDay, rateLimited, type Env } from '../../functions-lib/guard'

interface WindowStats {
  visitors: number | null
  pageviews: number | null
}

export async function onRequestGet(context: {
  request: Request
  env: Env
  waitUntil: (p: Promise<unknown>) => void
}): Promise<Response> {
  const { request, env } = context
  if (rateLimited('read', clientIp(request), 120)) return json({ error: 'rate-limited' }, 429)

  const empty: WindowStats = { visitors: null, pageviews: null }
  const fail = (error: string) => ({
    ok: false,
    body: { today: empty, yesterday: empty, total: empty, visitors: null, pageviews: null, error },
  })
  const db = env.DB
  if (!db) return json(fail('db-binding-missing').body)

  return edgeCached(request, '/api/visitors', 60, async () => {
    const today = kstDay()
    const yesterday = kstDay(-1)
    try {
      await ensureSchema(db)
      const [d, t] = await db.batch([
        db.prepare('SELECT day, visitors, pageviews FROM visit_daily WHERE day IN (?, ?)').bind(today, yesterday),
        db.prepare('SELECT visitors, pageviews FROM visit_total WHERE id = 1'),
      ])
      const rows = d.results as { day: string; visitors: number; pageviews: number }[]
      const pick = (day: string): WindowStats => {
        const r = rows.find((x) => x.day === day)
        return { visitors: r?.visitors ?? 0, pageviews: r?.pageviews ?? 0 }
      }
      const todayStats = pick(today)
      const total = (t.results[0] as WindowStats | undefined) ?? { visitors: 0, pageviews: 0 }
      return {
        ok: true,
        body: { today: todayStats, yesterday: pick(yesterday), total, visitors: todayStats.visitors, pageviews: todayStats.pageviews },
      }
    } catch (e) {
      console.error('visitors', e)
      return fail('db-error')
    }
  }, context.waitUntil)
}
