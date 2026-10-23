// Cloudflare Pages Function: 페이지뷰 기록 (방문자·글 조회수 D1 집계)
// 엔드포인트: POST /api/pageview  body { path }  → 204
// 클라이언트: src/components/PageviewBeacon.tsx 가 경로가 바뀔 때마다 1회 보낸다.
// 바인딩: Cloudflare Pages → Settings → Bindings → D1 database, 변수명 DB.

import { clientIp, isBot, isKnownSlug, json, rateLimited, recordPageview, sameOrigin, type Env } from '../../functions-lib/guard'

const MAX_BODY = 1024

export async function onRequestPost(context: {
  request: Request
  env: Env
  waitUntil: (p: Promise<unknown>) => void
}): Promise<Response> {
  const { request, env } = context
  // 정상 브라우저는 페이지 이동마다 1건
  if (rateLimited('pageview', clientIp(request), 60)) return json({ error: 'rate-limited' }, 429)
  if (!env.DB || isBot(request) || !sameOrigin(request)) return new Response(null, { status: 204 })
  const body = await request.text()
  if (body.length > MAX_BODY) return json({ error: 'too-large' }, 413)

  let path: string | null = null
  try {
    const msg = JSON.parse(body) as { path?: unknown }
    if (typeof msg.path === 'string') path = new URL(msg.path, 'https://x').pathname
  } catch {}
  if (path === null) return json({ error: 'bad-request' }, 400)

  const db = env.DB
  const slug = path.match(/^\/(?:ko|en|ja|zh|es)\/posts\/([^/]+)\/?$/)?.[1] ?? null
  context.waitUntil(
    (async () => {
      const known = slug !== null && (await isKnownSlug(env, request, slug))
      await recordPageview({ ...env, DB: db }, request, known ? slug : null)
    })().catch((e) => console.error('visit-count', e)),
  )
  return new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } })
}
