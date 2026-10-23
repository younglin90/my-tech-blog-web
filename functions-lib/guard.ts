// Pages Functions 공용: D1 스키마, 방문/조회 집계, 남용 방지 가드.
// functions/ 밖에 두는 이유: functions/ 안의 파일은 전부 라우트로 취급된다.
//
// 남용 방지 층 (비용이 싼 것부터):
//   1. 요청 크기·메서드·Origin 검사, 봇 UA 거절        → D1 접근 전 차단
//   2. isolate 메모리 rate limit (IP별 분당 횟수)      → 폭주 요청은 429
//   3. slug 화이트리스트 (/post-index.json)            → 임의 키로 행을 늘리는 공격 차단
//   4. D1 PRIMARY KEY 중복 제거 (해시된 IP 기준)       → 반복 요청은 0행 쓰기
//   5. GET 응답 엣지 캐시 (정규화된 키)                → 무한 조회도 D1에 닿지 않음

export interface D1Result<T> {
  results: T[]
  meta: { changes: number }
}
export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  run(): Promise<D1Result<unknown>>
  all<T>(): Promise<D1Result<T>>
}
export interface D1Database {
  prepare(sql: string): D1Statement
  batch(statements: D1Statement[]): Promise<D1Result<unknown>[]>
}
export interface Env {
  DB?: D1Database
  ASSETS?: { fetch(req: Request | string): Promise<Response> }
  HASH_SALT?: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const KST_OFFSET_MS = 9 * 60 * 60 * 1000

export function kstDay(offsetDays = 0): string {
  return new Date(Date.now() + KST_OFFSET_MS + offsetDays * DAY_MS).toISOString().slice(0, 10)
}

// ---------- 스키마 (isolate당 1회) ----------
const SCHEMA = [
  'CREATE TABLE IF NOT EXISTS visit_daily (day TEXT PRIMARY KEY, visitors INTEGER NOT NULL DEFAULT 0, pageviews INTEGER NOT NULL DEFAULT 0)',
  'CREATE TABLE IF NOT EXISTS visit_total (id INTEGER PRIMARY KEY CHECK (id = 1), visitors INTEGER NOT NULL DEFAULT 0, pageviews INTEGER NOT NULL DEFAULT 0)',
  'INSERT OR IGNORE INTO visit_total (id, visitors, pageviews) SELECT 1, COALESCE(SUM(visitors), 0), COALESCE(SUM(pageviews), 0) FROM visit_daily',
  // 오늘 이미 센 (방문자, 페이지) 쌍. k='*'는 방문자 자체. 지난 날짜 행은 바로 지운다.
  'CREATE TABLE IF NOT EXISTS seen (day TEXT NOT NULL, vid TEXT NOT NULL, k TEXT NOT NULL, PRIMARY KEY (day, vid, k)) WITHOUT ROWID',
  'DROP TABLE IF EXISTS visit_seen',
  'CREATE TABLE IF NOT EXISTS post_daily (day TEXT NOT NULL, slug TEXT NOT NULL, views INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, slug)) WITHOUT ROWID',
  'CREATE TABLE IF NOT EXISTS post_total (slug TEXT PRIMARY KEY, views INTEGER NOT NULL DEFAULT 0, up INTEGER NOT NULL DEFAULT 0, down INTEGER NOT NULL DEFAULT 0) WITHOUT ROWID',
  'CREATE TABLE IF NOT EXISTS post_vote (slug TEXT NOT NULL, vid TEXT NOT NULL, vote INTEGER NOT NULL, reason TEXT, ts INTEGER NOT NULL, PRIMARY KEY (slug, vid)) WITHOUT ROWID',
]
let schemaReady: Promise<unknown> | null = null
export function ensureSchema(db: D1Database): Promise<unknown> {
  if (!schemaReady) schemaReady = db.batch(SCHEMA.map((s) => db.prepare(s))).catch((e) => { schemaReady = null; throw e })
  return schemaReady
}

// ---------- 식별 ----------
export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For')?.split(',')[0].trim() || ''
}

// IP 원문은 저장하지 않는다. salt를 섞은 SHA-256 앞 12바이트만 쓴다.
export async function hashId(env: Env, ...parts: string[]): Promise<string> {
  const salt = env.HASH_SALT || 'cfdblog-visits'
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode([salt, ...parts].join('|')))
  return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')
}

const BOT_UA = /bot|crawl|spider|slurp|headless|phantom|puppeteer|playwright|selenium|curl|wget|python|httpclient|okhttp|go-http|java\/|libwww|scrapy|axios|node-fetch|undici|preview|monitor|lighthouse/i
export function isBot(request: Request): boolean {
  const ua = request.headers.get('User-Agent') || ''
  return ua.length < 20 || BOT_UA.test(ua)
}

// 쓰기 요청은 우리 페이지에서 온 것만. (curl로 위조는 가능 → 4번 층이 막는다)
export function sameOrigin(request: Request): boolean {
  const host = new URL(request.url).host
  const src = request.headers.get('Origin') || request.headers.get('Referer')
  if (!src) return false
  try { return new URL(src).host === host } catch { return false }
}

// ---------- rate limit (isolate 메모리, D1 비용 0) ----------
const buckets = new Map<string, { n: number; reset: number }>()
export function rateLimited(scope: string, ip: string, limit: number, windowMs = 60_000): boolean {
  const now = Date.now()
  if (buckets.size > 5000) for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k)
  const key = `${scope}:${ip}`
  const b = buckets.get(key)
  if (!b || b.reset < now) {
    buckets.set(key, { n: 1, reset: now + windowMs })
    return false
  }
  b.n++
  return b.n > limit
}

// ---------- slug 화이트리스트 ----------
// 형식만 거른다. 실제 존재 여부는 아래 post-index 화이트리스트가 판단한다.
// (예전 글은 날짜 접두사가 없거나 대문자가 섞여 있다: fdm-fem-fvm, 2026-03-27-simpleFoam-...)
const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,160}$/
let slugCache: { set: Set<string>; until: number } | null = null
export async function isKnownSlug(env: Env, request: Request, slug: string): Promise<boolean> {
  if (!SLUG_RE.test(slug)) return false
  if (!slugCache || slugCache.until < Date.now()) {
    const res = await (env.ASSETS ? env.ASSETS.fetch(new URL('/post-index.json', request.url).toString()) : fetch(new URL('/post-index.json', request.url)))
    if (!res.ok) return false
    const idx = (await res.json()) as { items?: { slug: string }[] }
    slugCache = { set: new Set((idx.items ?? []).map((i) => i.slug)), until: Date.now() + 10 * 60_000 }
  }
  return slugCache.set.has(slug)
}

// ---------- 응답 ----------
export function json(body: unknown, status = 200, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache },
  })
}

// GET 결과를 엣지에 ttl초 캐시. 키는 정규화된 파라미터로만 만들어
// ?x=랜덤 같은 캐시 우회가 D1까지 내려가지 못하게 한다.
// (Cache API는 커스텀 도메인에서만 동작 — *.pages.dev에서는 그냥 통과)
export async function edgeCached(
  request: Request,
  key: string,
  ttl: number,
  produce: () => Promise<{ body: unknown; ok: boolean }>,
  waitUntil: (p: Promise<unknown>) => void,
): Promise<Response> {
  const cache = (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default
  const cacheKey = new Request(new URL(key, request.url).toString())
  if (cache) {
    const hit = await cache.match(cacheKey)
    if (hit) return hit
  }
  const { body, ok } = await produce()
  const res = json(body, 200, ok ? `public, max-age=${ttl}` : 'no-store')
  if (cache && ok) waitUntil(cache.put(cacheKey, res.clone()))
  return res
}

// ---------- 페이지뷰 기록 ----------
// (방문자, 페이지, 날짜)가 처음일 때만 쓴다. 같은 IP의 새로고침·스팸은 0행 쓰기.
export async function recordPageview(env: Env & { DB: D1Database }, request: Request, slug: string | null): Promise<void> {
  const db = env.DB
  await ensureSchema(db)
  const day = kstDay()
  const vid = await hashId(env, clientIp(request), request.headers.get('User-Agent') || '', day)
  const [page, visitor] = await db.batch([
    db.prepare('INSERT OR IGNORE INTO seen (day, vid, k) VALUES (?, ?, ?)').bind(day, vid, slug ?? '_'),
    db.prepare('INSERT OR IGNORE INTO seen (day, vid, k) VALUES (?, ?, ?)').bind(day, vid, '*'),
  ])
  if (page.meta.changes === 0) return
  const newVisitor = visitor.meta.changes > 0 ? 1 : 0
  const stmts = [
    db.prepare('INSERT INTO visit_daily (day, visitors, pageviews) VALUES (?, ?, 1) ON CONFLICT(day) DO UPDATE SET visitors = visitors + excluded.visitors, pageviews = pageviews + 1').bind(day, newVisitor),
    db.prepare('UPDATE visit_total SET visitors = visitors + ?, pageviews = pageviews + 1 WHERE id = 1').bind(newVisitor),
  ]
  if (slug) {
    stmts.push(
      db.prepare('INSERT INTO post_daily (day, slug, views) VALUES (?, ?, 1) ON CONFLICT(day, slug) DO UPDATE SET views = views + 1').bind(day, slug),
      db.prepare('INSERT INTO post_total (slug, views) VALUES (?, 1) ON CONFLICT(slug) DO UPDATE SET views = views + 1').bind(slug),
    )
  }
  if (newVisitor) stmts.push(db.prepare('DELETE FROM seen WHERE day < ?').bind(day))
  await db.batch(stmts)
}
