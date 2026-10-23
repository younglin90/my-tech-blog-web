// Cloudflare Pages Function: 글 추천(👍/👎) 기록
// 엔드포인트: POST /api/feedback  body { slug, vote: 'up'|'down', reason? }  → { up, down }
//
// 조작 방지: 같은 Origin + 봇 UA 거절 + IP별 rate limit + 존재하는 slug만 +
// (slug, 해시된 IP)당 표 1개 — 다시 누르면 표가 늘지 않고 바뀌기만 한다.
// UA를 바꿔도 같은 IP면 같은 표다. 대신 같은 공유 IP(연구실 NAT 등)는 글당 1표로 묶인다.

import { clientIp, ensureSchema, hashId, isBot, isKnownSlug, json, rateLimited, sameOrigin, type Env } from '../../functions-lib/guard'

const REASONS = new Set([
  'feedback.r.clear', 'feedback.r.useful', 'feedback.r.code', 'feedback.r.viz',
  'feedback.r.unclear', 'feedback.r.tooHard', 'feedback.r.errors', 'feedback.r.shallow',
])

export async function onRequestPost(context: {
  request: Request
  env: Env
  waitUntil: (p: Promise<unknown>) => void
}): Promise<Response> {
  const { request, env } = context
  const ip = clientIp(request)
  if (!sameOrigin(request) || isBot(request)) return json({ error: 'forbidden' }, 403)
  if (rateLimited('vote', ip, 10) || rateLimited('vote-hour', ip, 40, 3_600_000)) return json({ error: 'rate-limited' }, 429)
  const raw = await request.text()
  if (raw.length > 512) return json({ error: 'too-large' }, 413)

  let msg: { slug?: unknown; vote?: unknown; reason?: unknown }
  try { msg = JSON.parse(raw) } catch { return json({ error: 'bad-json' }, 400) }
  const slug = typeof msg.slug === 'string' ? msg.slug : ''
  const vote = msg.vote === 'up' ? 1 : msg.vote === 'down' ? -1 : 0
  const reason = typeof msg.reason === 'string' && REASONS.has(msg.reason) ? msg.reason : null
  if (!vote) return json({ error: 'bad-vote' }, 400)
  if (!(await isKnownSlug(env, request, slug))) return json({ error: 'unknown-slug' }, 404)
  const db = env.DB
  if (!db) return json({ error: 'db-binding-missing' }, 503)

  try {
    await ensureSchema(db)
    const vid = await hashId(env, ip, 'vote')
    const { results } = await db.prepare('SELECT vote FROM post_vote WHERE slug = ? AND vid = ?').bind(slug, vid).all<{ vote: number }>()
    const prev = results[0]?.vote ?? 0
    const stmts = [
      db.prepare('INSERT INTO post_vote (slug, vid, vote, reason, ts) VALUES (?, ?, ?, ?, ?) ON CONFLICT(slug, vid) DO UPDATE SET vote = excluded.vote, reason = excluded.reason, ts = excluded.ts')
        .bind(slug, vid, vote, reason, Date.now()),
    ]
    if (prev !== vote) {
      const dUp = (vote === 1 ? 1 : 0) - (prev === 1 ? 1 : 0)
      const dDown = (vote === -1 ? 1 : 0) - (prev === -1 ? 1 : 0)
      stmts.push(
        db.prepare('INSERT INTO post_total (slug, up, down) VALUES (?, ?, ?) ON CONFLICT(slug) DO UPDATE SET up = up + excluded.up, down = down + excluded.down')
          .bind(slug, dUp, dDown),
      )
    }
    await db.batch(stmts)
    const { results: tot } = await db.prepare('SELECT up, down FROM post_total WHERE slug = ?').bind(slug).all<{ up: number; down: number }>()
    // 이 데이터센터의 post-stats 캐시를 비워 새 숫자가 바로 보이게
    const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default
    if (cache) context.waitUntil(cache.delete(new Request(new URL(`/api/post-stats?slug=${slug}`, request.url).toString())))
    return json(tot[0] ?? { up: 0, down: 0 })
  } catch (e) {
    console.error('feedback', e)
    return json({ error: 'db-error' }, 500)
  }
}
