// GET /api/comment-challenge → { nonce, image }
// 정답은 D1 comment_challenge 에만 있다. 댓글 POST 가 한 번 쓰고 지운다.

import { clientIp, ensureSchema, isBot, json, rateLimited, type Env } from '../../functions-lib/guard'
import { issueChallenge } from '../../functions-lib/comment-gate'

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context
  if (isBot(request)) return json({ error: 'forbidden' }, 403)
  const ip = clientIp(request)
  if (rateLimited('comment-gate', ip, 20) || rateLimited('comment-gate-hour', ip, 120, 3_600_000)) {
    return json({ error: 'rate-limited' }, 429)
  }
  const db = env.DB
  if (!db) return json({ error: 'db-binding-missing' }, 503)
  try {
    await ensureSchema(db)
    const issued = await issueChallenge(db)
    return json(issued, 200, 'no-store')
  } catch (e) {
    console.error('comment-challenge', e)
    return json({ error: 'db-error' }, 500)
  }
}
