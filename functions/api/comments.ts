// Cloudflare Pages Function: 글 댓글 (D1)
// GET  /api/comments?slug=...                    → { items: [{ id, name, body, ts }] }  (오래된 순)
// POST /api/comments  body { slug, name, body, website }  → { item }
//
// 조작 방지: 같은 Origin + 봇 UA 거절 + IP별 rate limit + 존재하는 slug만 +
// 길이 제한 + 링크 2개 초과 거절 + honeypot(website) + 같은 사람의 같은 글 10분 내 중복 거절.
// 숨김은 /admin/api/comments (Basic Auth) 에서.

import { clientIp, edgeCached, ensureSchema, hashId, isBot, isKnownSlug, json, purgeEdge, rateLimited, sameOrigin, type Env } from '../../functions-lib/guard'

const MAX_NAME = 40
const MAX_BODY = 2000

type Ctx = { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void }

export async function onRequestGet(context: Ctx): Promise<Response> {
  const { request, env } = context
  if (rateLimited('read', clientIp(request), 120)) return json({ items: [], error: 'rate-limited' }, 429)
  const slug = new URL(request.url).searchParams.get('slug') || ''
  if (!(await isKnownSlug(env, request, slug))) return json({ items: [], error: 'unknown-slug' }, 404)
  const db = env.DB
  if (!db) return json({ items: [], error: 'db-binding-missing' })

  return edgeCached(request, `/api/comments?slug=${slug}`, 30, async () => {
    try {
      await ensureSchema(db)
      const { results } = await db
        .prepare('SELECT id, name, body, ts FROM comment WHERE slug = ? AND hidden = 0 ORDER BY ts ASC LIMIT 500')
        .bind(slug)
        .all<{ id: number; name: string; body: string; ts: number }>()
      return { ok: true, body: { items: results } }
    } catch (e) {
      console.error('comments-get', e)
      return { ok: false, body: { items: [], error: 'db-error' } }
    }
  }, context.waitUntil)
}

export async function onRequestPost(context: Ctx): Promise<Response> {
  const { request, env } = context
  const ip = clientIp(request)
  if (!sameOrigin(request) || isBot(request)) return json({ error: 'forbidden' }, 403)
  if (rateLimited('comment', ip, 3) || rateLimited('comment-hour', ip, 20, 3_600_000)) return json({ error: 'rate-limited' }, 429)
  const raw = await request.text()
  if (raw.length > 8192) return json({ error: 'too-large' }, 413)

  let msg: { slug?: unknown; name?: unknown; body?: unknown; website?: unknown }
  try { msg = JSON.parse(raw) } catch { return json({ error: 'bad-json' }, 400) }
  const slug = typeof msg.slug === 'string' ? msg.slug : ''
  const name = typeof msg.name === 'string' ? msg.name.replace(/\s+/g, ' ').trim() : ''
  const body = typeof msg.body === 'string' ? msg.body.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n').trim() : ''
  // honeypot: 사람에게는 보이지 않는 칸. 채워져 있으면 성공처럼 응답하고 저장하지 않는다.
  if (typeof msg.website === 'string' && msg.website !== '') return json({ item: null })
  if (!name || name.length > MAX_NAME) return json({ error: 'bad-name' }, 400)
  if (body.length < 2 || body.length > MAX_BODY) return json({ error: 'bad-body' }, 400)
  if ((body.match(/https?:\/\//g) ?? []).length > 2) return json({ error: 'too-many-links' }, 400)
  if (!(await isKnownSlug(env, request, slug))) return json({ error: 'unknown-slug' }, 404)
  const db = env.DB
  if (!db) return json({ error: 'db-binding-missing' }, 503)

  try {
    await ensureSchema(db)
    const vid = await hashId(env, ip, 'comment')
    const now = Date.now()
    const { results: dup } = await db
      .prepare('SELECT id FROM comment WHERE slug = ? AND vid = ? AND body = ? AND ts > ?')
      .bind(slug, vid, body, now - 10 * 60_000)
      .all<{ id: number }>()
    if (dup.length) return json({ error: 'duplicate' }, 409)
    await db.prepare('INSERT INTO comment (slug, name, body, ts, vid) VALUES (?, ?, ?, ?, ?)').bind(slug, name, body, now, vid).run()
    const { results } = await db
      .prepare('SELECT id, name, body, ts FROM comment WHERE slug = ? AND vid = ? ORDER BY id DESC LIMIT 1')
      .bind(slug, vid)
      .all<{ id: number; name: string; body: string; ts: number }>()
    purgeEdge(request, [`/api/comments?slug=${slug}`, `/api/post-stats?slug=${slug}`, '/api/recent-comments', '/api/stats'], context.waitUntil)
    return json({ item: results[0] ?? null })
  } catch (e) {
    console.error('comments-post', e)
    return json({ error: 'db-error' }, 500)
  }
}
