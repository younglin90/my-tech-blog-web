// Cloudflare Pages Function: Umami 추적 스크립트 프록시
// 엔드포인트: GET /stats/script.js
// 광고 차단기가 cloud.umami.is/script.js 를 차단하는 문제 우회 (same-origin 서빙).

const UPSTREAM = 'https://cloud.umami.is/script.js'

export async function onRequestGet(): Promise<Response> {
  const upstream = await fetch(UPSTREAM, {
    cf: { cacheTtl: 3600, cacheEverything: true },
  })
  const body = await upstream.text()
  return new Response(body, {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
      'X-Proxied-From': 'cloud.umami.is',
    },
  })
}
