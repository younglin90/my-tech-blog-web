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
const usedSections = new Map()
let key = null
for (const line of yaml.split('\n')) {
  // 키는 따옴표가 있을 수도("a/b.md":) 없을 수도(a/b.md:) 있다. 둘 다 받는다.
  // 따옴표를 강제하면 구 스키마 60여 항목이 통째로 '미사용'으로 잘못 뜬다.
  const k = line.match(/^ {2}"?(.+?\.md)"?:\s*(?:"(\d{4}-\d{2}-\d{2})")?\s*$/)
  if (k) {
    key = k[1]
    if (k[2]) lastUsed.set(key, Date.parse(k[2]))
    continue
  }
  const d = line.match(/date:\s*"(\d{4}-\d{2}-\d{2})"/)
  if (key && d) lastUsed.set(key, Math.max(lastUsed.get(key) ?? 0, Date.parse(d[1])))
  const s = line.match(/^\s*sections:\s*\[(.+)\]\s*$/)
  if (key && s) usedSections.set(key, (usedSections.get(key) ?? []).concat(s[1]))
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
const pickedSecs = usedSections.get(pick.p.replace('source-docs/', ''))
if (pickedSecs) console.log(`      이미 읽은 섹션(제외할 것): ${pickedSecs.join(' ')}`)

// ── 3. 전체 포스트 메타 (주제 중복 판정용) ────────────────────────────────────
const allPosts = koFiles
  .map((n) => {
    const t = readFileSync(join(POSTS, 'ko', n), 'utf-8')
    const f = (re) => (t.match(re) ?? [])[1] ?? ''
    return {
      date: f(/^date:\s*(\S+)/m),
      title: f(/^title:\s*"(.+)"/m),
      tags: f(/^tags:\s*(.+)$/m),
      slug: f(/^slug:\s*(.+)$/m),
      secs: [...t.matchAll(/^## (.+)$/gm)].map((m) => m[1]),
      viz: [...new Set([...t.matchAll(/<([A-Z][A-Za-z0-9]+)\s*\/?>/g)].map((m) => m[1]))],
      sigs: [...new Set([...t.matchAll(/^(?:class|def) ([A-Za-z_][A-Za-z_0-9]*)/gm)].map((m) => m[1]))],
      open: (t.split(/^---$/m)[2] ?? '').replace(/^import .*$/gm, '').trim().slice(0, 46),
    }
  })
  .filter((r) => r.date)
  .sort((a, b) => (a.date < b.date ? 1 : -1))

// 소스 파일명·폴더에서 뽑은 토큰이 과거 포스트 제목/태그/slug에 몇 개나 박혀 있는지 센다.
// 목적은 정확도가 아니라 "이 소재 이미 썼을지도" 신호 하나를 공짜로 주는 것.
const STOP = new Set(['정리', '만들기', '방법', '문서', '노트', '자료', '내용', '대한', '위한', '기본', 'the', 'and', 'for', 'with'])
const tokensOf = (p) =>
  [...new Set(
    // 그룹 폴더명(fluid-mechanics 등)은 그날 후보 전부가 공유하므로 토큰에서 뺀다.
    p.replace(`source-docs/${FOLDER}/`, '').replace(/\.md$/, '').split(/[^0-9A-Za-z가-힣]+/)
      .map((w) => w.trim()).filter((w) => w.length >= 2 && !/^\d+$/.test(w) && !STOP.has(w.toLowerCase())),
  )]
const overlap = (p, limit) => {
  const toks = tokensOf(p)
  return allPosts
    .map((r) => {
      const hay = `${r.title} ${r.tags} ${r.slug}`.toLowerCase()
      const hit = toks.filter((t) => hay.includes(t.toLowerCase()))
      return { ...r, score: hit.length, hit }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || (a.date < b.date ? 1 : -1))
    .slice(0, limit)
}

console.log('\nPICK_OVERLAP (이 소재로 이미 쓴 글 — 2점 이상이면 제목·섹션을 의심하고 ALT로 옮길 것)')
const po = overlap(pick.p, 3)
if (po.length === 0) console.log('  없음')
for (const r of po) console.log(`  ${r.score}점 ${r.date} ${r.title.slice(0, 60)}  [${r.hit.join(',')}]`)

console.log('\nALT_OVERLAP')
for (const c of cand.filter((c) => c !== pick).slice(0, 4)) {
  const top = overlap(c.p, 1)[0]
  console.log(`  ${c.p.split('/').pop()} → ${top ? `${top.score}점 ${top.date} ${top.title.slice(0, 50)}` : '겹치는 글 없음'}`)
}

const recent = allPosts.slice(0, 10)

console.log('\nRECENT_POSTS (중복 금지 대상)')
for (const r of recent) {
  console.log(`- ${r.date} ${r.title}`)
  console.log(`  tags ${r.tags}  viz ${r.viz.join(',')}`)
  console.log(`  ## ${r.secs.join(' / ')}`)
  console.log(`  open "${r.open}…"`)
}
console.log(`\nUSED_VIZ  ${[...new Set(recent.flatMap((r) => r.viz))].join(', ')}`)
console.log(`USED_SIGS ${[...new Set(recent.flatMap((r) => r.sigs))].join(', ')}`)

// ── 4. 기존 태그 (새 태그는 포스트당 최대 2개 — 나머지는 여기서 고른다) ───────
const tagCount = new Map()
for (const r of allPosts)
  for (const t of (r.tags.match(/"([^"]+)"/g) ?? []).map((s) => s.slice(1, -1)))
    tagCount.set(t, (tagCount.get(t) ?? 0) + 1)
const tagList = [...tagCount.entries()].sort((a, b) => b[1] - a[1])
console.log(`\nEXISTING_TAGS (${tagList.length}개, 2회 이상만 표시 — 철자·대소문자 그대로 재사용)`)
console.log('  ' + tagList.filter(([, c]) => c >= 2).map(([t, c]) => `${t}:${c}`).join(' '))

// ── 5. 빌드 전제조건 (여기서 안 보면 npm run build에서 한 사이클 날린다) ──────
console.log(`\nDEPS  node_modules ${existsSync('node_modules/katex') ? 'OK' : '없음 → npm ci 먼저 실행할 것'}`)
