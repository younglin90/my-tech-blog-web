// Cloudflare Pages Function: Umami 이벤트 수집 엔드포인트 프록시
// 엔드포인트: POST /stats/api/send
// data-host-url="/stats" 와 함께 사용 → 추적 스크립트가 same-origin 으로 이벤트 송신.

const UPSTREAM = 'https://cloud.umami.is/api/send'

export async function onRequestPost(context: { request: Request }): Promise<Response> {
  const { request } = context
  const body = await request.text()
  const upstream = await fetch(UPSTREAM, {
    method: 'POST',
    headers: {
      'Content-Type': request.headers.get('Content-Type') || 'application/json',
      'User-Agent': request.headers.get('User-Agent') || '',
      // 실제 방문자 IP 를 Umami 로 전달 (지역·고유 방문자 집계용)
      'X-Forwarded-For':
        request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For') ||
        '',
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
