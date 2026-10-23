// Cloudflare Pages Function: "지난 N일 인기 글 top N"
// 엔드포인트: GET /api/top-posts?limit=5&days=7
//
// 데이터: /stats/api/send 가 D1(바인딩명 DB)의 post_daily 에 집계한 글별 조회수
// (방문자·글·날짜당 1회). 응답: { items: [{slug, views}], days }
// 엣지에 10분 캐시 — 키는 정규화된 limit/days 뿐이라 임의 파라미터로 캐시를 우회할 수 없다.

import { clientIp, edgeCached, ensureSchema, json, kstDay, rateLimited, type Env } from '../../functions-lib/guard'

export async function onRequestGet(context: {
  request: Request
  env: Env
  waitUntil: (p: Promise<unknown>) => void
}): Promise<Response> {
  const { request, env } = context
  if (rateLimited('read', clientIp(request), 120)) return json({ items: [], error: 'rate-limited' }, 429)
  const url = new URL(request.url)
  const limit = Math.min(20, Math.max(1, parseInt(url.searchParams.get('limit') || '5', 10) || 5))
  const days = Math.min(30, Math.max(1, parseInt(url.searchParams.get('days') || '7', 10) || 7))
  const db = env.DB
  if (!db) return json({ items: [], error: 'db-binding-missing' })

  return edgeCached(request, `/api/top-posts?limit=${limit}&days=${days}`, 600, async () => {
    try {
      await ensureSchema(db)
      const { results } = await db
        .prepare('SELECT slug, SUM(views) AS views FROM post_daily WHERE day > ? GROUP BY slug ORDER BY views DESC LIMIT ?')
        .bind(kstDay(-days), limit)
        .all<{ slug: string; views: number }>()
      return { ok: true, body: { items: results, days } }
    } catch (e) {
      console.error('top-posts', e)
      return { ok: false, body: { items: [], error: 'db-error' } }
    }
  }, context.waitUntil)
}
