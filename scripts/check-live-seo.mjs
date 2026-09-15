#!/usr/bin/env node
/**
 * 배포된 sitemap과 대표 페이지를 Googlebot 관점에서 검사한다.
 *
 * 사용:
 *   npm run seo:live
 *   node scripts/check-live-seo.mjs --base https://example.com
 */

const args = process.argv.slice(2)
const baseArg = args.find((arg, i) => args[i - 1] === '--base')
const BASE = (baseArg ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://cfdblog.cc').replace(/\/$/, '')
const ORIGIN = new URL(BASE).origin
const USER_AGENT = 'Googlebot/2.1 (+http://www.google.com/bot.html)'
const TIMEOUT_MS = 15_000
const MAX_URLS = 50_000

function fail(message) {
  throw new Error(message)
}

function decodeXml(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function locs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeXml(match[1]))
}

async function fetchText(url, expectedType) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: `${expectedType},*/*;q=0.8` },
    redirect: 'manual',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (response.status !== 200) fail(`${url}: HTTP ${response.status} (200 필요)`)

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes(expectedType)) {
    fail(`${url}: Content-Type ${contentType || '(없음)'} (${expectedType} 필요)`)
  }
  if (/\bnoindex\b/i.test(response.headers.get('x-robots-tag') ?? '')) {
    fail(`${url}: X-Robots-Tag에 noindex가 있다`)
  }

  return { response, text: await response.text(), contentType }
}

const indexUrl = `${BASE}/sitemap.xml`
const { text: indexXml } = await fetchText(indexUrl, 'xml')
if (!indexXml.startsWith('<?xml') || !indexXml.includes('<sitemapindex')) {
  fail(`${indexUrl}: sitemap index XML이 아니다`)
}

const childUrls = locs(indexXml)
if (childUrls.length === 0) fail(`${indexUrl}: 자식 sitemap이 없다`)
if (new Set(childUrls).size !== childUrls.length) fail(`${indexUrl}: 중복 자식 sitemap이 있다`)

let totalUrls = 0
const representativePages = []
for (const childUrl of childUrls) {
  const parsed = new URL(childUrl)
  if (parsed.origin !== ORIGIN) fail(`${childUrl}: sitemap과 다른 origin이다`)

  const { text: childXml } = await fetchText(childUrl, 'xml')
  if (!childXml.startsWith('<?xml') || !childXml.includes('<urlset')) {
    fail(`${childUrl}: urlset XML이 아니다`)
  }

  const pageUrls = locs(childXml)
  if (pageUrls.length === 0) fail(`${childUrl}: URL이 없다`)
  if (pageUrls.length > MAX_URLS) fail(`${childUrl}: URL ${pageUrls.length}개로 상한 초과`)
  if (new Set(pageUrls).size !== pageUrls.length) fail(`${childUrl}: 중복 URL이 있다`)
  for (const pageUrl of pageUrls) {
    if (new URL(pageUrl).origin !== ORIGIN) fail(`${pageUrl}: sitemap과 다른 origin이다`)
  }

  totalUrls += pageUrls.length
  representativePages.push(pageUrls[0])
  console.log(`✓ ${childUrl} — ${pageUrls.length} URLs`)
}

for (const pageUrl of representativePages) {
  const { text: html } = await fetchText(pageUrl, 'text/html')
  if (/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html)) {
    fail(`${pageUrl}: robots meta에 noindex가 있다`)
  }
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]
  if (canonical !== pageUrl) {
    fail(`${pageUrl}: canonical 불일치 (${canonical || '없음'})`)
  }
  console.log(`✓ ${pageUrl} — 200, indexable, canonical 일치`)
}

console.log(`✅ live SEO: sitemap ${childUrls.length}개, URL ${totalUrls}개, 대표 페이지 정상`)
