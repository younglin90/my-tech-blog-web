#!/usr/bin/env node
// Lighthouse 점수 측정. 로컬 정적 파일(`out/`)을 서빙하고 5개 핵심 URL에 대해 측정.
//
// 사용법:
//   npm run build && node scripts/lighthouse.mjs
//
// 필요 패키지 (전역 설치 권장 — devDependency 폭증 방지):
//   npx lighthouse --help  # chrome + lighthouse CLI가 있으면 OK
//
// 측정 대상 (locale=en 기준):
//   /en/                           홈
//   /en/posts/{첫 번째 슬러그}     포스트 상세
//   /en/tags                       태그 목록
//   /en/about                      소개
//   /en/tags/CFD                   태그 필터

import { spawn } from 'node:child_process'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { extname } from 'node:path'

const PORT = 4873
const OUT_DIR = join(process.cwd(), 'out')

if (!existsSync(OUT_DIR)) {
  console.error('❌ out/ 없음. 먼저 `npm run build`를 실행하세요.')
  process.exit(1)
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.xml': 'application/xml', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.ttf': 'font/ttf',
}

// 1) 간단한 정적 파일 서버 (next export 결과물을 /에 매핑)
const server = createServer((req, res) => {
  try {
    const u = new URL(req.url ?? '/', `http://localhost:${PORT}`)
    let filePath = join(OUT_DIR, decodeURIComponent(u.pathname))
    if (!existsSync(filePath)) filePath += '.html'
    if (!existsSync(filePath)) {
      filePath = join(OUT_DIR, decodeURIComponent(u.pathname), 'index.html')
    }
    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      res.statusCode = 404; res.end('Not found'); return
    }
    const type = MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
    res.setHeader('Content-Type', type)
    createReadStream(filePath).pipe(res)
  } catch (e) {
    res.statusCode = 500; res.end(String(e))
  }
})

await new Promise<void>((resolve) => server.listen(PORT, resolve))
console.log(`📡 serving out/ on http://localhost:${PORT}`)

// 2) 첫 포스트 슬러그 찾기 (en 기준, 없으면 ko)
function firstSlug(locale: string): string | null {
  const dir = join(OUT_DIR, locale, 'posts')
  if (!existsSync(dir)) return null
  return readdirSync(dir).filter((n) => existsSync(join(dir, n, 'index.html')))[0] ?? null
}
const locale = existsSync(join(OUT_DIR, 'en')) ? 'en' : 'ko'
const slug = firstSlug(locale)

const urls = [
  `http://localhost:${PORT}/${locale}/`,
  slug ? `http://localhost:${PORT}/${locale}/posts/${slug}` : null,
  `http://localhost:${PORT}/${locale}/tags`,
  `http://localhost:${PORT}/${locale}/about`,
].filter(Boolean) as string[]

console.log('🔦 Lighthouse 측정 대상:')
urls.forEach((u) => console.log(`   ${u}`))

// 3) Lighthouse CLI 호출 (npx)
const results: Array<{ url: string; perf?: number; a11y?: number; bp?: number; seo?: number; error?: string }> = []
for (const url of urls) {
  console.log(`\n[${urls.indexOf(url) + 1}/${urls.length}] ${url}`)
  try {
    const out = await new Promise<string>((resolve, reject) => {
      const proc = spawn(
        'npx',
        ['--yes', 'lighthouse', url, '--quiet', '--chrome-flags=--headless --no-sandbox', '--output=json', '--output-path=stdout'],
        { stdio: ['ignore', 'pipe', 'inherit'] },
      )
      let buf = ''
      proc.stdout.on('data', (c) => (buf += c))
      proc.on('close', (code) => (code === 0 ? resolve(buf) : reject(new Error(`exit ${code}`))))
    })
    const j = JSON.parse(out)
    const cat = j.categories
    results.push({
      url,
      perf: Math.round((cat.performance?.score ?? 0) * 100),
      a11y: Math.round((cat.accessibility?.score ?? 0) * 100),
      bp: Math.round((cat['best-practices']?.score ?? 0) * 100),
      seo: Math.round((cat.seo?.score ?? 0) * 100),
    })
  } catch (e: any) {
    results.push({ url, error: e.message })
  }
}

console.log('\n📊 결과')
console.log('URL'.padEnd(60) + ' PERF  A11Y  BP    SEO')
for (const r of results) {
  if (r.error) { console.log(r.url.padEnd(60) + ' ERROR: ' + r.error); continue }
  console.log(r.url.padEnd(60) + ` ${String(r.perf).padEnd(5)} ${String(r.a11y).padEnd(5)} ${String(r.bp).padEnd(5)} ${String(r.seo)}`)
}

server.close()
process.exit(0)
