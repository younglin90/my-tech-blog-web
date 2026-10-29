// Cloudflare Pages Function: 최근 댓글 (홈 화면용)
// GET /api/recent-comments → { items: [{ id, slug, name, body, ts }] }  (최신 순 8개, 본문은 160자로 자름)
// 엣지에 60초 캐시. 새 댓글이 달리면 /api/comments POST가 이 데이터센터 캐시를 비운다.

import { clientIp, edgeCached, ensureSchema, json, rateLimited, type Env } from '../../functions-lib/guard'

export async function onRequestGet(context: {
  request: Request
  env: Env
  waitUntil: (p: Promise<unknown>) => void
}): Promise<Response> {
  const { request, env } = context
  if (rateLimited('read', clientIp(request), 120)) return json({ items: [], error: 'rate-limited' }, 429)
  const db = env.DB
  if (!db) return json({ items: [], error: 'db-binding-missing' })

  return edgeCached(request, '/api/recent-comments', 60, async () => {
    try {
      await ensureSchema(db)
      const { results } = await db
        .prepare('SELECT id, slug, name, substr(body, 1, 160) AS body, ts FROM comment WHERE hidden = 0 ORDER BY ts DESC LIMIT 8')
        .all<{ id: number; slug: string; name: string; body: string; ts: number }>()
      return { ok: true, body: { items: results } }
    } catch (e) {
      console.error('recent-comments', e)
      return { ok: false, body: { items: [], error: 'db-error' } }
    }
  }, context.waitUntil)
}
