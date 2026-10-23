// Cloudflare Pages Function: Umami 이벤트 수집 엔드포인트 프록시
// 엔드포인트: POST /stats/api/send
// data-host-url="/stats" 와 함께 사용 → 추적 스크립트가 same-origin 으로 이벤트 송신.
//
// 방문자·글 조회수 집계도 여기서 한다 (Umami 통계 API는 Pro 플랜 전용이라 읽어올 수 없음).
// 바인딩: Cloudflare Pages → Settings → Bindings → D1 database, 변수명 DB.
// 바인딩이 없으면 집계만 건너뛰고 프록시는 그대로 동작한다.

import { clientIp, isBot, isKnownSlug, json, rateLimited, recordPageview, sameOrigin, type Env } from '../../../functions-lib/guard'

const UPSTREAM = 'https://cloud.umami.is/api/send'
const MAX_BODY = 8 * 1024

export async function onRequestPost(context: {
  request: Request
  env: Env
  waitUntil: (p: Promise<unknown>) => void
}): Promise<Response> {
  const { request, env } = context
  const ip = clientIp(request)
  // 정상 브라우저는 페이지 이동마다 1~2건 — 분당 60건을 넘으면 업스트림 트래픽도 아낀다
  if (rateLimited('send', ip, 60)) return json({ error: 'rate-limited' }, 429)
  const body = await request.text()
  if (body.length > MAX_BODY) return json({ error: 'too-large' }, 413)

  // Umami 페이로드: { type: 'event', payload: { url, name? } } — name이 없으면 페이지뷰
  if (env.DB && !isBot(request) && sameOrigin(request)) {
    let path: string | null = null
    try {
      const msg = JSON.parse(body) as { type?: string; payload?: { url?: string; name?: string } }
      if (msg.type === 'event' && !msg.payload?.name && typeof msg.payload?.url === 'string') {
        path = new URL(msg.payload.url, 'https://x').pathname
      }
    } catch {}
    if (path !== null) {
      const db = env.DB
      const slug = path.match(/^\/(?:ko|en|ja|zh|es)\/posts\/([^/]+)\/?$/)?.[1] ?? null
      context.waitUntil(
        (async () => {
          const known = slug !== null && (await isKnownSlug(env, request, slug))
          await recordPageview({ ...env, DB: db }, request, known ? slug : null)
        })().catch((e) => console.error('visit-count', e)),
      )
    }
  }

  const upstream = await fetch(UPSTREAM, {
    method: 'POST',
    headers: {
      'Content-Type': request.headers.get('Content-Type') || 'application/json',
      'User-Agent': request.headers.get('User-Agent') || '',
      // 실제 방문자 IP 를 Umami 로 전달 (지역·고유 방문자 집계용)
      'X-Forwarded-For': ip,
    },
    body,
  })
  const text = await upstream.text()
  return new Response(text, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
