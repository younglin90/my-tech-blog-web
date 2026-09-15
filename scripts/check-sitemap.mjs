#!/usr/bin/env node
/**
 * scripts/check-sitemap.mjs — 배포 전에 sitemap이 '가져올 수 있는' 상태인지 확인.
 *
 * Search Console의 "가져올 수 없음"은 원인을 알려주지 않고, 한 번 실패하면
 * 재시도가 거의 없어서 몇 달간 0개로 남는다. 배포 전에 잡는 편이 훨씬 싸다.
 *
 * 검사 항목 (전부 실제로 사이트맵을 죽이는 것들):
 *   - BOM / 선행 공백 — 있으면 XML 파서가 즉시 거부한다
 *   - XML well-formed
 *   - 인덱스가 가리키는 자식 sitemap 파일이 실제로 존재하는가
 *   - <loc>의 호스트가 SITE_URL과 일치하는가 (교차 호스트는 Google이 거부)
 *   - 크기 한도 (URL 50,000개 / 압축 전 50MB)
 */
import { readFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'out'
const INDEX = join(ROOT, 'sitemap.xml')
const MAX_URLS = 50_000
const MAX_BYTES = 50 * 1024 * 1024

const fail = (msg) => {
  console.error(`❌ sitemap: ${msg}`)
  process.exitCode = 1
}

if (!existsSync(INDEX)) {
  fail('out/sitemap.xml 없음 — robots.txt가 가리키는 URL이 404가 된다')
  process.exit(1)
}

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cfdblog.cc').replace(/\/$/, '')

/** BOM·선행 공백·well-formedness를 한 번에 본다 */
const readXml = (path) => {
  const buf = readFileSync(path)
  if (buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    fail(`${path}: UTF-8 BOM으로 시작 — XML 파서가 거부한다`)
    return null
  }
  const text = buf.toString('utf-8')
  if (!text.startsWith('<?xml')) {
    fail(`${path}: '<?xml'로 시작하지 않음 (선행 공백/개행 의심)`)
    return null
  }
  // 태그 균형만 보는 얕은 검사 — 외부 파서 의존 없이 깨진 XML을 잡는다
  const opens = (text.match(/<(url|sitemap)>/g) ?? []).length
  const closes = (text.match(/<\/(url|sitemap)>/g) ?? []).length
  if (opens !== closes) {
    fail(`${path}: <url>/<sitemap> 태그 불균형 (${opens} vs ${closes})`)
    return null
  }
  return text
}

const indexText = readXml(INDEX)
if (!indexText) process.exit(1)

const children = [...indexText.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
if (children.length === 0) fail('인덱스에 자식 sitemap이 하나도 없다')

let totalUrls = 0
for (const loc of children) {
  if (!loc.startsWith(`${SITE_URL}/`)) {
    fail(`자식 sitemap 호스트 불일치: ${loc} (기대: ${SITE_URL})`)
    continue
  }
  const rel = loc.slice(SITE_URL.length)
  const path = join(ROOT, rel)
  if (!existsSync(path) || !statSync(path).isFile()) {
    fail(`인덱스가 가리키는 파일이 없다: ${rel}`)
    continue
  }
  const text = readXml(path)
  if (!text) continue
  const urls = (text.match(/<url>/g) ?? []).length
  const bytes = statSync(path).size
  totalUrls += urls
  if (urls > MAX_URLS) fail(`${rel}: URL ${urls}개 — 상한 ${MAX_URLS} 초과`)
  if (bytes > MAX_BYTES) fail(`${rel}: ${bytes} bytes — 상한 50MB 초과`)
}

// robots.txt가 실제로 이 인덱스를 가리키는지
const robots = join(ROOT, 'robots.txt')
if (existsSync(robots)) {
  const r = readFileSync(robots, 'utf-8')
  if (!r.includes(`${SITE_URL}/sitemap.xml`)) {
    fail(`robots.txt가 ${SITE_URL}/sitemap.xml을 가리키지 않는다`)
  }
}

// Cloudflare Pages는 public/_headers를 out/_headers로 복사한다. 전역 nosniff가 켜진
// 상태에서 sitemap의 MIME 타입이 빠지면 브라우저에서는 XML이 보여도 Google의
// sitemap 파서가 "가져올 수 없음"으로 거부할 수 있다. 실제 배포 설정을 함께 고정한다.
const headersPath = join(ROOT, '_headers')
if (!existsSync(headersPath)) {
  fail('out/_headers 없음 — Cloudflare sitemap Content-Type 설정을 확인할 수 없다')
} else {
  const headersText = readFileSync(headersPath, 'utf-8').replace(/\r\n/g, '\n')
  const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  for (const route of ['/sitemap.xml', '/sitemap/*']) {
    const block = headersText.match(
      new RegExp(`^${escapeRe(route)}\\n((?:[ \\t]+[^\\n]*(?:\\n|$))*)`, 'm'),
    )?.[1]
    if (!block) {
      fail(`out/_headers에 ${route} 규칙이 없다`)
    } else if (!/^\s*Content-Type:\s*(?:application|text)\/xml\b/im.test(block)) {
      fail(`out/_headers의 ${route}에 XML Content-Type이 없다`)
    }
  }
}

if (process.exitCode === 1) process.exit(1)
console.log(
  `✅ sitemap: 인덱스 + 자식 ${children.length}개, URL ${totalUrls}개, ` +
  'BOM/호스트/한도/Cloudflare Content-Type 정상',
)
