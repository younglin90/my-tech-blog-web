#!/usr/bin/env node
/**
 * scripts/check-internal-links.mjs — out/의 모든 HTML에서 내부 링크를 뽑아
 * 실제로 그 파일이 존재하는지 확인한다.
 *
 * 왜 필요한가: Search Console의 "찾을 수 없음(404)"은 어떤 URL인지 알려주는 데
 * 몇 주가 걸린다. 깨진 내부 링크는 배포 전에 out/만 보면 100% 잡힌다.
 *
 * 실제로 잡았던 버그: locale 세그먼트가 없는 라우트(/admin, /read, 404)에서
 * 언어 스위처가 /ko/admin/ 같은 존재하지 않는 URL을 locale마다 하나씩 뱉었다(20개).
 */
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'out'
if (!existsSync(ROOT)) {
  console.error('check-internal-links: out/ 없음 — next build 이후에 실행할 것')
  process.exit(1)
}

const htmlFiles = []
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.html')) htmlFiles.push(p)
  }
}
walk(ROOT)

// url → 그 링크를 처음 내보낸 파일
const targets = new Map()
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf-8')
  for (const m of html.matchAll(/href="(\/[^"#?]*)"/g)) {
    if (!targets.has(m[1])) targets.set(m[1], f)
  }
}

// _redirects에 등재된 출발지는 CF가 301로 받아주므로 404가 아니다.
const redirectSources = new Set()
if (existsSync(join(ROOT, '_redirects'))) {
  for (const line of readFileSync(join(ROOT, '_redirects'), 'utf-8').split('\n')) {
    const m = line.trim().match(/^(\/\S+)\s+\S+/)
    if (m) redirectSources.add(m[1])
  }
}

const resolves = (url) => {
  if (redirectSources.has(url)) return true
  let p
  try {
    p = join(ROOT, decodeURIComponent(url))
  } catch {
    return false // 잘못 인코딩된 URL
  }
  if (existsSync(p) && statSync(p).isFile()) return true
  if (existsSync(join(p, 'index.html'))) return true
  if (existsSync(`${p}.html`)) return true
  return false
}

const broken = [...targets].filter(([url]) => !resolves(url))

if (broken.length === 0) {
  console.log(`✅ 내부 링크: ${targets.size}개 전부 해소 (HTML ${htmlFiles.length}개 스캔)`)
  process.exit(0)
}

console.error(`❌ 깨진 내부 링크 ${broken.length}개 (고유 링크 ${targets.size}개 중)`)
for (const [url, src] of broken.slice(0, 40)) {
  console.error(`   ${url}\n      ← ${src.replace(`${ROOT}/`, '')}`)
}
if (broken.length > 40) console.error(`   ... 외 ${broken.length - 40}개`)
process.exit(1)
