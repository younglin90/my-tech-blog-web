#!/usr/bin/env node
/**
 * scripts/daily-context.mjs — 매일 포스트 루틴 0~4단계를 한 번에 출력.
 *
 * KST 날짜/요일 → 그룹 → 소스 후보 선택(rotation) → 최근 10개 포스트 중복 컨텍스트까지
 * 한 번의 호출로 뽑는다. 예전에는 이 과정에 bash 8~10회 왕복이 들었고 출력이 컨텍스트를
 * 크게 잡아먹었다. 출력은 60줄 이내로 고정한다.
 *
 *   node scripts/daily-context.mjs            # 오늘(KST)
 *   node scripts/daily-context.mjs 2026-08-10 # 날짜 지정
 */

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const GROUPS = {
  Mon: ['cfd-technique', 'CFD 기법 + 알고리즘'],
  Tue: ['fluid-mechanics', '유체역학 이론 + 유동 현상'],
  Wed: ['cfd-technique', 'CFD 기법 + 알고리즘'],
  Thu: ['fluid-mechanics', '유체역학 이론 + 유동 현상'],
  Fri: ['cfd-technique', 'CFD 기법 + 알고리즘'],
  Sat: ['paper-review', '논문 리뷰 + 재현'],
  Sun: ['paper-review', '논문 리뷰 + 재현'],
}
const KO_DAY = { Mon: '월요일', Tue: '화요일', Wed: '수요일', Thu: '목요일', Fri: '금요일', Sat: '토요일', Sun: '일요일' }

const arg = process.argv[2]
const now = arg ? new Date(`${arg}T12:00:00+09:00`) : new Date()
const kst = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short',
}).formatToParts(now)
const get = (t) => kst.find((p) => p.type === t).value
const DATE = `${get('year')}-${get('month')}-${get('day')}`
const DOW = get('weekday')
const [FOLDER, TOPIC] = GROUPS[DOW]

console.log(`DATE=${DATE}  DOW=${DOW}(${KO_DAY[DOW]})  GROUP=${TOPIC}  SRC=source-docs/${FOLDER}/`)

// ── 1. 날짜 중복 ──────────────────────────────────────────────────────────────
const POSTS = 'src/content/posts'
const koFiles = readdirSync(join(POSTS, 'ko')).filter((n) => n.endsWith('.mdx'))
if (koFiles.some((n) => n.startsWith(DATE))) {
  console.log(`ALREADY_EXISTS  ${koFiles.find((n) => n.startsWith(DATE))}  → 종료`)
  process.exit(0)
}

// ── 2. 소스 후보 (미사용 우선 → 오래된 순) ────────────────────────────────────
const walk = (d) =>
  existsSync(d)
    ? readdirSync(d).flatMap((n) => {
        const p = join(d, n)
        return statSync(p).isDirectory() ? walk(p) : /\.(md|txt)$/.test(n) ? [p] : []
      })
    : []

const all = walk(join('source-docs', FOLDER))
if (all.length === 0) {
  console.log(`SKIP  source-docs/${FOLDER}/ 비어 있음`)
  process.exit(0)
}

const yaml = readFileSync('source-docs/index.yaml', 'utf-8')
const lastUsed = new Map()
let key = null
for (const line of yaml.split('\n')) {
  const k = line.match(/^ {2}"(.+?)":\s*(?:"(\d{4}-\d{2}-\d{2})")?\s*$/) // 신·구 스키마 모두
  if (k) {
    key = k[1]
    if (k[2]) lastUsed.set(key, Date.parse(k[2]))
    continue
  }
  const d = line.match(/date:\s*"(\d{4}-\d{2}-\d{2})"/)
  if (key && d) lastUsed.set(key, Math.max(lastUsed.get(key) ?? 0, Date.parse(d[1])))
}
const today = Date.parse(DATE)
const scored = all
  .map((p) => ({ p, used: lastUsed.get(p.replace('source-docs/', '')) ?? 0 }))
  .sort((a, b) => a.used - b.used)
const pool = scored.filter((s) => s.used === 0)
const cand = (pool.length ? pool : scored).slice(0, 12)
const pick = cand[Math.floor(Math.random() * cand.length)]
const age = (u) => (u ? `${Math.round((today - u) / 864e5)}일 전` : '미사용')
console.log(`\nPICK  ${pick.p}  (${age(pick.used)}, ${statSync(pick.p).size}B)`)
console.log('ALT   ' + cand.filter((c) => c !== pick).slice(0, 4).map((c) => `${c.p.split('/').pop()} [${age(c.used)}]`).join(' | '))

// ── 3. 최근 10개 포스트 (중복 방지용 압축 컨텍스트) ───────────────────────────
const recent = koFiles
  .map((n) => {
    const t = readFileSync(join(POSTS, 'ko', n), 'utf-8')
    const f = (re) => (t.match(re) ?? [])[1] ?? ''
    return {
      date: f(/^date:\s*(\S+)/m),
      title: f(/^title:\s*"(.+)"/m),
      tags: f(/^tags:\s*(.+)$/m),
      secs: [...t.matchAll(/^## (.+)$/gm)].map((m) => m[1]),
      viz: [...new Set([...t.matchAll(/<([A-Z][A-Za-z0-9]+)\s*\/?>/g)].map((m) => m[1]))],
      sigs: [...new Set([...t.matchAll(/^(?:class|def) ([A-Za-z_][A-Za-z_0-9]*)/gm)].map((m) => m[1]))],
      open: (t.split(/^---$/m)[2] ?? '').replace(/^import .*$/gm, '').trim().slice(0, 46),
    }
  })
  .filter((r) => r.date)
  .sort((a, b) => (a.date < b.date ? 1 : -1))
  .slice(0, 10)

console.log('\nRECENT_POSTS (중복 금지 대상)')
for (const r of recent) {
  console.log(`- ${r.date} ${r.title}`)
  console.log(`  tags ${r.tags}  viz ${r.viz.join(',')}`)
  console.log(`  ## ${r.secs.join(' / ')}`)
  console.log(`  open "${r.open}…"`)
}
console.log(`\nUSED_VIZ  ${[...new Set(recent.flatMap((r) => r.viz))].join(', ')}`)
console.log(`USED_SIGS ${[...new Set(recent.flatMap((r) => r.sigs))].join(', ')}`)
