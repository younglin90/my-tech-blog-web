// Cloudflare Pages Function: Umami 이벤트 수집 엔드포인트 프록시
// 엔드포인트: POST /stats/api/send
// data-host-url="/stats" 와 함께 사용 → 추적 스크립트가 same-origin 으로 이벤트 송신.
//
// 방문자 수 집계도 여기서 한다 (Umami 통계 API는 Pro 플랜 전용이라 읽어올 수 없음).
// 바인딩: Cloudflare Pages → Settings → Bindings → D1 database, 변수명 DB.
// 바인딩이 없으면 집계만 건너뛰고 프록시는 그대로 동작한다.

interface D1Statement {
  bind(...values: unknown[]): D1Statement
  run(): Promise<{ meta: { changes: number } }>
}
interface D1Database {
  prepare(sql: string): D1Statement
  batch(statements: D1Statement[]): Promise<{ meta: { changes: number } }[]>
}
interface Env {
  DB?: D1Database
}

const UPSTREAM = 'https://cloud.umami.is/api/send'
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS visit_daily (day TEXT PRIMARY KEY, visitors INTEGER NOT NULL DEFAULT 0, pageviews INTEGER NOT NULL DEFAULT 0)',
  'CREATE TABLE IF NOT EXISTS visit_seen (day TEXT NOT NULL, vid TEXT NOT NULL, PRIMARY KEY (day, vid))',
]

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// 페이지뷰 1회 기록. 방문자는 KST 하루 단위로 (IP+UA+날짜) 해시가 처음일 때만 +1.
// IP 원문은 저장하지 않고, 지난 날짜의 해시는 바로 지운다.
async function recordPageview(db: D1Database, ip: string, ua: string): Promise<void> {
  const day = new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10)
  const vid = await sha256Hex(`${ip}|${ua}|${day}`)
  await db.batch(SCHEMA.map((sql) => db.prepare(sql)))
  const [seen] = await db.batch([
    db.prepare('INSERT OR IGNORE INTO visit_seen (day, vid) VALUES (?, ?)').bind(day, vid),
    db.prepare('INSERT INTO visit_daily (day, pageviews) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET pageviews = pageviews + 1').bind(day),
  ])
  if (seen.meta.changes > 0) {
    await db.batch([
      db.prepare('UPDATE visit_daily SET visitors = visitors + 1 WHERE day = ?').bind(day),
      db.prepare('DELETE FROM visit_seen WHERE day < ?').bind(day),
    ])
  }
}

export async function onRequestPost(context: {
  request: Request
  env: Env
  waitUntil: (p: Promise<unknown>) => void
}): Promise<Response> {
  const { request, env } = context
  const body = await request.text()
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || ''

  // Umami 페이로드: { type: 'event', payload: { url, name? } } — name이 없으면 페이지뷰
  if (env.DB) {
    let isPageview = false
    try {
      const msg = JSON.parse(body) as { type?: string; payload?: { name?: string } }
      isPageview = msg.type === 'event' && !msg.payload?.name
    } catch {}
    if (isPageview) {
      context.waitUntil(
        recordPageview(env.DB, ip, request.headers.get('User-Agent') || '').catch((e) => console.error('visit-count', e)),
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
