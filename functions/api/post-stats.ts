// Cloudflare Pages Function: 글 하나의 조회수·추천수
// 엔드포인트: GET /api/post-stats?slug=...  → { views, up, down }
// 존재하는 slug만 받고, 결과는 엣지에 60초 캐시 (D1 읽기는 slug당 분당 1회 이하).

import { clientIp, edgeCached, ensureSchema, isKnownSlug, json, rateLimited, type Env } from '../../functions-lib/guard'

export async function onRequestGet(context: {
  request: Request
  env: Env
  waitUntil: (p: Promise<unknown>) => void
}): Promise<Response> {
  const { request, env } = context
  if (rateLimited('read', clientIp(request), 120)) return json({ error: 'rate-limited' }, 429)
  const slug = new URL(request.url).searchParams.get('slug') || ''
  if (!(await isKnownSlug(env, request, slug))) return json({ error: 'unknown-slug' }, 404)
  const db = env.DB
  if (!db) return json({ error: 'db-binding-missing' })

  return edgeCached(request, `/api/post-stats?slug=${slug}`, 60, async () => {
    try {
      await ensureSchema(db)
      const { results } = await db
        .prepare('SELECT views, up, down FROM post_total WHERE slug = ?')
        .bind(slug)
        .all<{ views: number; up: number; down: number }>()
      return { ok: true, body: results[0] ?? { views: 0, up: 0, down: 0 } }
    } catch (e) {
      console.error('post-stats', e)
      return { ok: false, body: { error: 'db-error' } }
    }
  }, context.waitUntil)
}
