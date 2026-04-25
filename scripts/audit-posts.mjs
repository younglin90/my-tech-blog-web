#!/usr/bin/env node
/**
 * scripts/audit-posts.mjs
 *
 * 자동 포스팅 다양성 모니터링 도구.
 * src/content/posts/ko/ 의 최근 N개 포스트를 분석해 드리프트 신호를 출력한다.
 *
 *   node scripts/audit-posts.mjs           # 최근 15개
 *   node scripts/audit-posts.mjs 30        # 최근 30개
 *   node scripts/audit-posts.mjs --all     # 전체
 *
 * 보고 항목:
 *   - viz 사용률 (목표 ≥ 90%)
 *   - viz 컴포넌트 빈도 분포 (편중 감지)
 *   - 도입부 클리셰 hit
 *   - ## 섹션 헤딩 중복 top-N
 *   - 태그 빈도 top-N
 *   - 코드 시그니처 (class/def) top-N
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const POSTS_DIR = 'src/content/posts/ko'
const args = process.argv.slice(2)
const ALL = args.includes('--all')
const N = ALL ? Infinity : parseInt(args.find((a) => /^\d+$/.test(a)) ?? '15', 10)

const PRE_BUILT_VIZ = [
  'VelocityField', 'StreamLine', 'NumericalScheme',
  'PressureContour', 'BoundaryCondition', 'NumericalDungeon', 'MachArchitect',
]

const CLICHES = [
  '필수적이다', '살펴본다', '기본이 된다', '빠질 수 없', '핵심은',
]

function loadPosts() {
  const files = readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => {
      const path = join(POSTS_DIR, f)
      const content = readFileSync(path, 'utf-8')
      const fm = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
      if (!fm) return null
      const date = fm[1].match(/^date:\s*(\S+)/m)?.[1] ?? ''
      const title = fm[1].match(/^title:\s*"?([^"\n]+)"?/m)?.[1] ?? ''
      const tagsRaw = fm[1].match(/^tags:\s*\[([^\]]+)\]/m)?.[1] ?? ''
      const tags = tagsRaw.split(',').map((t) => t.trim().replace(/['"]/g, '')).filter(Boolean)
      return { file: f, date, title, tags, body: fm[2] }
    })
    .filter(Boolean)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
  return files.slice(0, N)
}

function extractViz(body) {
  const used = new Set()
  for (const name of PRE_BUILT_VIZ) {
    if (new RegExp(`<${name}[\\s/>]`).test(body)) used.add(name)
  }
  const customMatches = body.matchAll(/from ['"]@\/components\/post-viz\/[^'"]+\/(\w+)['"]/g)
  for (const m of customMatches) used.add(`(custom) ${m[1]}`)
  return Array.from(used)
}

function extractSections(body) {
  return Array.from(body.matchAll(/^##\s+(.+)$/gm)).map((m) => m[1].trim())
}

function extractOpening(body) {
  const para = body.replace(/^#.*$/gm, '').trim().split(/\n\n/)[0] ?? ''
  return para.replace(/[*_`]/g, '').trim().slice(0, 200)
}

function extractCodeSignatures(body) {
  return Array.from(body.matchAll(/^(?:class|def|function|fn|struct)\s+(\w+)/gm)).map((m) => m[1])
}

function topN(map, n) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
}

function bar(count, max, width = 20) {
  const filled = Math.round((count / max) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

// ── 분석 ──────────────────────────────────────────
const posts = loadPosts()
if (posts.length === 0) {
  console.error('포스트 없음')
  process.exit(1)
}

const vizFreq = new Map()
const tagFreq = new Map()
const sectionFreq = new Map()
const sigFreq = new Map()
let withViz = 0
let clicheHits = 0
const noVizPosts = []
const cliches = []

for (const p of posts) {
  const viz = extractViz(p.body)
  if (viz.length > 0) withViz++
  else noVizPosts.push(p)
  for (const v of viz) vizFreq.set(v, (vizFreq.get(v) ?? 0) + 1)
  for (const t of p.tags) tagFreq.set(t, (tagFreq.get(t) ?? 0) + 1)
  for (const s of extractSections(p.body)) sectionFreq.set(s, (sectionFreq.get(s) ?? 0) + 1)
  for (const sig of extractCodeSignatures(p.body)) sigFreq.set(sig, (sigFreq.get(sig) ?? 0) + 1)
  const opening = extractOpening(p.body)
  for (const c of CLICHES) {
    if (opening.includes(c)) {
      clicheHits++
      cliches.push({ file: p.file, cliche: c, opening: opening.slice(0, 80) })
      break
    }
  }
}

const total = posts.length
const vizPct = ((withViz / total) * 100).toFixed(0)
const dateRange = `${posts[total - 1].date} ~ ${posts[0].date}`

console.log(`\n📊 자동 포스팅 다양성 감사 (최근 ${total}편 · ${dateRange})\n`)

console.log(`▸ viz 사용률   : ${withViz}/${total} (${vizPct}%) — 목표 ≥ 90%`)
if (vizPct < 90) console.log(`  ⚠️  viz 누락 포스트:`)
for (const p of noVizPosts) console.log(`     · ${p.file}`)

console.log(`\n▸ viz 컴포넌트 분포 (편중도)`)
if (vizFreq.size === 0) console.log('  (사용된 viz 없음)')
else {
  const vizMax = Math.max(...vizFreq.values())
  for (const [name, count] of topN(vizFreq, 15)) {
    console.log(`  ${bar(count, vizMax, 12)} ${count.toString().padStart(2)} ${name}`)
  }
  const used = vizFreq.size
  console.log(`  → 사용 컴포넌트 ${used}종 / pre-built 7종 + custom 다수`)
}

console.log(`\n▸ ## 섹션 헤딩 중복 top 10 (자주 반복되면 구조 클리셰 위험)`)
const sectionDupes = topN(sectionFreq, 10).filter(([, c]) => c >= 2)
if (sectionDupes.length === 0) console.log('  ✓ 2회 이상 반복된 섹션 없음')
else {
  for (const [s, c] of sectionDupes) {
    console.log(`  ${c}× "${s}"`)
  }
}

console.log(`\n▸ 태그 빈도 top 10 (한 태그가 절반 이상이면 편중 경고)`)
const tagMax = Math.max(...tagFreq.values(), 1)
for (const [t, c] of topN(tagFreq, 10)) {
  const warn = c / total > 0.5 ? ' ⚠️' : ''
  console.log(`  ${bar(c, tagMax, 12)} ${c.toString().padStart(2)} ${t}${warn}`)
}

console.log(`\n▸ 코드 시그니처(class/def/function) 중복 (재사용 ≥ 2회)`)
const sigDupes = topN(sigFreq, 10).filter(([, c]) => c >= 2)
if (sigDupes.length === 0) console.log('  ✓ 시그니처 중복 없음')
else for (const [s, c] of sigDupes) console.log(`  ${c}× ${s}`)

console.log(`\n▸ 도입부 클리셰: ${clicheHits}건`)
if (clicheHits > 0) {
  for (const c of cliches) console.log(`  · [${c.cliche}] ${c.file}\n      "${c.opening}..."`)
} else {
  console.log('  ✓ 클리셰 hit 없음')
}

console.log()
const score =
  (vizPct >= 90 ? 1 : 0) +
  (sectionDupes.length === 0 ? 1 : 0) +
  (Math.max(...tagFreq.values()) / total <= 0.5 ? 1 : 0) +
  (sigDupes.length === 0 ? 1 : 0) +
  (clicheHits === 0 ? 1 : 0)
console.log(`종합: ${score}/5 항목 통과\n`)
process.exit(score >= 4 ? 0 : 0) // 정보용; pre-commit 차단 안 함
