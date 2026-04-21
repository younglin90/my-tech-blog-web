// 간단한 헬스체크 — Pages Functions 배포 여부 확인용.
// 성공 시: {"ok":true,"time":"..."}  (HTTP 200)
export async function onRequestGet(): Promise<Response> {
  return new Response(
    JSON.stringify({ ok: true, time: new Date().toISOString() }),
    { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } },
  )
}
