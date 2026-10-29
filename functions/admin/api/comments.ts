// Cloudflare Pages Function: 댓글 관리 (관리자 전용)
// /admin/* 경로라 functions/_middleware.ts의 Basic Auth를 통과해야만 여기 닿는다.
// GET  /admin/api/comments          → 최근 100개 (숨긴 것 포함)
// POST /admin/api/comments  body { id, hidden: boolean }  → 숨김/복원

import { ensureSchema, json, purgeEdge, sameOrigin, type Env } from '../../../functions-lib/guard'

type Ctx = { request: Request; env: Env; waitUntil: (p: Promise<unknown>) => void }

export async function onRequestGet({ env }: Ctx): Promise<Response> {
  const db = env.DB
  if (!db) return json({ items: [], error: 'db-binding-missing' })
  await ensureSchema(db)
  const { results } = await db
    .prepare('SELECT id, slug, name, body, ts, hidden FROM comment ORDER BY ts DESC LIMIT 100')
    .all()
  return json({ items: results })
}

export async function onRequestPost(context: Ctx): Promise<Response> {
  const { request, env } = context
  if (!sameOrigin(request)) return json({ error: 'forbidden' }, 403)
  const db = env.DB
  if (!db) return json({ error: 'db-binding-missing' }, 503)
  let msg: { id?: unknown; hidden?: unknown }
  try { msg = await request.json() } catch { return json({ error: 'bad-json' }, 400) }
  if (typeof msg.id !== 'number' || typeof msg.hidden !== 'boolean') return json({ error: 'bad-request' }, 400)
  await ensureSchema(db)
  await db.prepare('UPDATE comment SET hidden = ? WHERE id = ?').bind(msg.hidden ? 1 : 0, msg.id).run()
  const { results } = await db.prepare('SELECT slug FROM comment WHERE id = ?').bind(msg.id).all<{ slug: string }>()
  const slug = results[0]?.slug
  purgeEdge(request, ['/api/recent-comments', '/api/stats', ...(slug ? [`/api/comments?slug=${slug}`] : [])], context.waitUntil)
  return json({ ok: true })
}
