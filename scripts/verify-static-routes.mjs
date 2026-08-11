#!/usr/bin/env node
/**
 * scripts/verify-static-routes.mjs — 배포 전 크롤 불변식 게이트
 *
 * 예전에는 파일 8개의 existsSync만 확인했다. 그래서 sitemap이 제출하는 URL과 각 페이지가
 * 선언하는 canonical이 3,145개 전부 어긋나 있어도, 전 페이지가 lang="en"으로 나가도,
 * /preview 중복 129개가 딸려 나가도 빌드는 초록불이었다.
 *
 * 여기서 막는 것:
 *   1. sitemap의 <loc>이 끝 슬래시로 끝나는가 (next.config.ts trailingSlash: true)
 *   2. 그 URL에 해당하는 index.html이 실제로 존재하는가
 *   3. 그 파일의 canonical이 <loc>과 바이트 단위로 같은가
 *   4. sitemap에 올린 페이지가 noindex를 달고 있지 않은가 (모순 신호)
 *   5. <image:loc>이 실제 PNG 파일인가
 *   6. sitemap 인덱스가 실제 존재하는 per-locale sitemap만 가리키는가
 *   7. locale 페이지의 <html lang>이 en이 아닌 실제 locale인가
 *   8. draft/test 픽스처가 새어 나가지 않았는가
 *   9. 잘못된 도메인을 담은 public/robots.txt가 부활하지 않았는가
 *
 * XML 파서를 새로 넣지 않는다 — 우리가 만든 XML이라 정규식으로 충분하다.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const OUT = join(process.cwd(), 'out')
const LOCALES = ['ko', 'en', 'ja', 'zh', 'es']
const SITE = 'https://cfdblog.cc'

const errors = []
const fail = (msg) => errors.push(msg)

// --- 0. 필수 파일 --------------------------------------------------------
for (const f of [
  'index.html',
  'sitemap.xml',
  'robots.txt',
  'feed.xml',
  'feed-en.xml',
  'feed-ja.xml',
  'feed-zh.xml',
  'feed-es.xml',
  '_redirects',
]) {
  if (!existsSync(join(OUT, f))) fail(`필수 파일 없음: out/${f}`)
}
for (const l of LOCALES) {
  if (!existsSync(join(OUT, l, 'index.html')) && !existsSync(join(OUT, `${l}.html`))) {
    fail(`locale 루트 없음: out/${l}/index.html`)
  }
}
if (existsSync(join(process.cwd(), 'public/robots.txt'))) {
  fail('public/robots.txt가 다시 생겼습니다 — src/app/robots.ts 하나만 쓰세요')
}

// --- 1. sitemap 인덱스 ---------------------------------------------------
const indexXml = existsSync(join(OUT, 'sitemap.xml')) ? readFileSync(join(OUT, 'sitemap.xml'), 'utf-8') : ''
const listed = [...indexXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
const sitemapDir = join(OUT, 'sitemap')
const present = existsSync(sitemapDir) ? readdirSync(sitemapDir).filter((f) => f.endsWith('.xml')) : []
for (const url of listed) {
  const name = url.split('/').pop()
  if (!present.includes(name)) fail(`sitemap 인덱스가 없는 파일을 가리킴: ${url}`)
}
if (present.length !== listed.length) {
  fail(`sitemap 인덱스 항목 ${listed.length}개 ≠ 실제 파일 ${present.length}개`)
}

// --- 2. 각 URL의 슬래시 / 존재 / canonical / noindex ---------------------
let checked = 0
let imagesChecked = 0
const seenSlugs = new Set()

for (const name of present) {
  const xml = readFileSync(join(sitemapDir, name), 'utf-8')

  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const url = m[1]
    checked++

    if (!url.endsWith('/')) {
      fail(`<loc>이 슬래시로 끝나지 않음: ${url}`)
      continue
    }
    const rel = url.replace(SITE, '')
    const file = join(OUT, rel, 'index.html')
    if (!existsSync(file)) {
      fail(`sitemap URL에 해당하는 파일 없음: ${url}`)
      continue
    }
    const html = readFileSync(file, 'utf-8')

    const canon = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
    if (!canon) fail(`canonical 없음: ${url}`)
    else if (canon !== url) fail(`canonical 불일치\n    sitemap:   ${url}\n    canonical: ${canon}`)

    if (/name="robots"[^>]*content="[^"]*noindex/.test(html)) {
      fail(`sitemap에 올렸는데 noindex: ${url}`)
    }

    const slugM = rel.match(/\/posts\/([^/]+)\/$/)
    if (slugM) {
      seenSlugs.add(slugM[1])
      if (/^(draft|test)-/.test(slugM[1])) fail(`draft/test 픽스처가 배포에 포함됨: ${url}`)
    }
  }

  for (const m of xml.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)) {
    const rel = m[1].replace(SITE, '')
    const file = join(OUT, rel)
    if (!existsSync(file)) {
      fail(`OG 이미지 파일 없음: ${m[1]}`)
      continue
    }
    const head = readFileSync(file).subarray(0, 8)
    if (head[0] !== 0x89 || head[1] !== 0x50 || head[2] !== 0x4e || head[3] !== 0x47) {
      fail(`OG 이미지가 PNG가 아님: ${m[1]}`)
    }
    imagesChecked++
  }
}

// --- 3. html lang --------------------------------------------------------
for (const l of LOCALES) {
  const f = join(OUT, l, 'index.html')
  if (!existsSync(f)) continue
  const lang = readFileSync(f, 'utf-8').match(/<html lang="([^"]+)"/)?.[1]
  if (lang !== l) fail(`out/${l}/index.html의 <html lang>이 "${lang}" (기대: "${l}")`)
}

// --- 4. 미리보기 중복 ----------------------------------------------------
const previewDir = join(OUT, 'preview')
if (existsSync(previewDir)) {
  const n = readdirSync(previewDir).filter((d) => d !== 'disabled').length
  if (n > 0) fail(`/preview에 ${n}개 페이지가 있습니다 — 포스트 전문 중복입니다`)
}

// --- 결과 ---------------------------------------------------------------
if (errors.length > 0) {
  console.error(`❌ 크롤 불변식 위반 ${errors.length}건:`)
  for (const e of errors.slice(0, 25)) console.error(`  - ${e}`)
  if (errors.length > 25) console.error(`  ... 외 ${errors.length - 25}건`)
  process.exit(1)
}

console.log(
  `✅ crawl invariants: ${checked}개 URL (canonical·슬래시·noindex), ` +
    `${imagesChecked}개 OG 이미지, ${seenSlugs.size}개 포스트 slug, html lang ${LOCALES.length}개 locale`
)
