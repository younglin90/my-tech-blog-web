#!/usr/bin/env node
/**
 * scripts/check-links.mjs
 *
 * src/content/posts/**/*.mdx 의 모든 링크 추출 → HTTP 200 여부 검사.
 * 결과는 stdout + (--out 지정 시) JSON 파일로 저장.
 *
 * 사용법:
 *   node scripts/check-links.mjs                       # 전체 검사
 *   node scripts/check-links.mjs --internal-only       # 내부 링크만
 *   node scripts/check-links.mjs --out broken.json     # 깨진 링크 JSON 출력
 *   node scripts/check-links.mjs --base http://localhost:3000  # 내부 링크 베이스 URL
 *
 * 종료 코드:
 *   0 = 깨진 링크 없음
 *   1 = 1개 이상 깨진 링크
 */

import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const args = process.argv.slice(2)
const INTERNAL_ONLY = args.includes('--internal-only')
const BASE = args.find((a, i) => args[i - 1] === '--base') ?? 'https://cfdblog.cc'
const OUT_FILE = args.find((a, i) => args[i - 1] === '--out')

function walk(dir) {
  const out = []
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) out.push(...walk(p))
    else if (e.isFile() && p.endsWith('.mdx')) out.push(p)
  }
  return out
}

const files = walk('src/content/posts')
console.log(`📑 ${files.length}개 mdx 파일에서 링크 수집 중...`)

const links = new Map() // url → Set<file>
for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  // markdown link [text](url)
  const re = /\[(?:[^\]]*?)\]\(([^)\s]+)\)/g
  let m
  while ((m = re.exec(content)) !== null) {
    let url = m[1]
    // 앵커만이면 skip
    if (url.startsWith('#')) continue
    // 상대 → 절대 (BASE)
    if (url.startsWith('/')) url = BASE.replace(/\/$/, '') + url
    if (INTERNAL_ONLY && !url.startsWith(BASE)) continue
    if (!links.has(url)) links.set(url, new Set())
    links.get(url).add(file)
  }
}

console.log(`🔗 고유 URL ${links.size}개 검사 (HEAD → GET fallback)`)

const results = []
let i = 0
const concurrency = 10
const all = Array.from(links.keys())

async function checkOne(url) {
  // CFD 블로그 외부 링크는 종종 GET만 응답. HEAD 4xx → GET 재시도.
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 12000)
    let res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, redirect: 'follow' })
    if (!res.ok) {
      res = await fetch(url, { method: 'GET', signal: ctrl.signal, redirect: 'follow' })
    }
    clearTimeout(timer)
    return { url, status: res.status, ok: res.ok }
  } catch (e) {
    return { url, status: 0, ok: false, error: e.message ?? String(e) }
  }
}

async function runBatch() {
  const queue = [...all]
  const workers = Array(concurrency).fill(null).map(async () => {
    while (queue.length) {
      const url = queue.shift()
      const r = await checkOne(url)
      results.push(r)
      i++
      if (i % 20 === 0) console.log(`  ... ${i}/${all.length}`)
    }
  })
  await Promise.all(workers)
}

await runBatch()

const broken = results.filter((r) => !r.ok)
console.log(`\n📊 결과: 정상 ${results.length - broken.length}, 깨짐 ${broken.length}`)

if (OUT_FILE) {
  const payload = broken.map((b) => ({
    url: b.url,
    status: b.status,
    error: b.error,
    files: Array.from(links.get(b.url) ?? []),
  }))
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2))
  console.log(`💾 ${OUT_FILE}`)
}

if (broken.length === 0) {
  console.log('✅ 깨진 링크 없음')
  process.exit(0)
}

console.log('\n❌ 깨진 링크:')
for (const b of broken.slice(0, 30)) {
  const files = Array.from(links.get(b.url) ?? []).slice(0, 3).join(', ')
  console.log(`  [${b.status || 'ERR'}] ${b.url}`)
  console.log(`    in: ${files}`)
}
if (broken.length > 30) console.log(`  ... +${broken.length - 30} more`)
process.exit(1)
