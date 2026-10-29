// Cloudflare Pages Function: 모든 글의 조회수·추천수·댓글수 한 번에
// GET /api/stats → { items: { [slug]: [views, up, comments] } }
// 글 목록이 행마다 숫자를 보여주려고 부른다. 엣지에 5분 캐시 — D1 읽기는 데이터센터당 5분에 2쿼리.

import { clientIp, edgeCached, ensureSchema, json, rateLimited, type Env } from '../../functions-lib/guard'

export async function onRequestGet(context: {
  request: Request
  env: Env
  waitUntil: (p: Promise<unknown>) => void
}): Promise<Response> {
  const { request, env } = context
  if (rateLimited('read', clientIp(request), 120)) return json({ items: {}, error: 'rate-limited' }, 429)
  const db = env.DB
  if (!db) return json({ items: {}, error: 'db-binding-missing' })

  return edgeCached(request, '/api/stats', 300, async () => {
    try {
      await ensureSchema(db)
      const [totals, comments] = await db.batch([
        db.prepare('SELECT slug, views, up FROM post_total'),
        db.prepare('SELECT slug, COUNT(*) AS n FROM comment WHERE hidden = 0 GROUP BY slug'),
      ])
      const items: Record<string, [number, number, number]> = {}
      for (const r of totals.results as { slug: string; views: number; up: number }[]) items[r.slug] = [r.views, r.up, 0]
      for (const r of comments.results as { slug: string; n: number }[]) (items[r.slug] ??= [0, 0, 0])[2] = r.n
      return { ok: true, body: { items } }
    } catch (e) {
      console.error('stats', e)
      return { ok: false, body: { items: {}, error: 'db-error' } }
    }
  }, context.waitUntil)
}
