import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const SITE_URL = 'https://tech-blog.dev'
const SITE_TITLE = "Younglin's CFD Blog"
const LOCALES = ['ko', 'en', 'ja', 'zh', 'es']

const LOCALE_META = {
  ko: { iso: 'ko-KR', desc: 'CFD 엔지니어를 위한 기술 저널 — 수식, 코드, 인터랙티브 시각화', editor: '영린' },
  en: { iso: 'en-US', desc: "Field notes from a compressible multiphase CFD researcher — equations, code, interactive visualizations", editor: 'Younglin' },
  ja: { iso: 'ja-JP', desc: '圧縮性多相流CFD研究者の作業ノート — 数式、コード、インタラクティブ可視化', editor: 'Younglin' },
  zh: { iso: 'zh-CN', desc: '可压缩多相流CFD研究者的工作笔记 — 公式、代码、交互式可视化', editor: 'Younglin' },
  es: { iso: 'es-ES', desc: 'Notas de campo de un investigador en CFD multifase compresible — ecuaciones, código, visualizaciones interactivas', editor: 'Younglin' },
}

function loadAllPosts() {
  const raw = readFileSync(join(process.cwd(), '.contentlayer/generated/Post/_index.json'), 'utf-8')
  return JSON.parse(raw).filter((p) => !p.draft)
}

function postSlug(p) {
  return p.slug || (p._raw?.flattenedPath ?? '').replace(/^[a-z]{2}\//, '')
}

function postLocale(p) {
  return p.locale || (p._raw?.flattenedPath ?? '').match(/^([a-z]{2})\//)?.[1] || 'ko'
}

/** locale별 포스트 목록: 해당 locale 우선, 없으면 ko fallback. 같은 slug 중복 제거. */
function postsForLocale(allPosts, locale) {
  const bySlug = new Map()
  allPosts.filter((p) => postLocale(p) === 'ko').forEach((p) => bySlug.set(postSlug(p), p))
  if (locale !== 'ko') {
    allPosts.filter((p) => postLocale(p) === locale).forEach((p) => bySlug.set(postSlug(p), p))
  }
  return Array.from(bySlug.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

/** Strip MDX/JSX/frontmatter for a plain-text excerpt */
function extractExcerpt(raw, maxChars = 1500) {
  const text = raw
    .replace(/^---[\s\S]*?---/, '')
    .replace(/<[^>]+>/g, '')
    .replace(/```[\s\S]*?```/g, '[code block]')
    .replace(/\$\$[\s\S]*?\$\$/g, '[equation]')
    .replace(/\$[^$]+\$/g, '[math]')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return text.length > maxChars ? text.slice(0, maxChars) + '…' : text
}

function generateRss(posts, locale) {
  const meta = LOCALE_META[locale]
  const items = posts.map((post) => {
    const slug = postSlug(post)
    const url = `${SITE_URL}/${locale}/posts/${slug}`
    const categories = (post.tags ?? []).map((t) => `      <category>${t}</category>`).join('\n')
    const metaStr = [post.readingTime, post.wordCount ? `${post.wordCount.toLocaleString()} words` : null]
      .filter(Boolean).join(' · ')
    const excerpt = post.body?.raw ? extractExcerpt(post.body.raw) : post.description
    const desc = metaStr ? `${post.description}\n\n[${metaStr}]` : post.description
    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${desc}]]></description>
      <content:encoded><![CDATA[${excerpt}

---
Read more: ${url}]]></content:encoded>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>noreply@tech-blog.dev (${meta.editor})</author>${categories ? '\n' + categories : ''}
    </item>`
  }).join('')

  const feedPath = locale === 'ko' ? '/feed.xml' : `/feed-${locale}.xml`
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${SITE_TITLE} (${locale})</title>
    <description>${meta.desc}</description>
    <link>${SITE_URL}/${locale}</link>
    <atom:link href="${SITE_URL}${feedPath}" rel="self" type="application/rss+xml"/>
    <language>${meta.iso}</language>
    <managingEditor>noreply@tech-blog.dev (${meta.editor})</managingEditor>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>1440</ttl>${items}
  </channel>
</rss>`
}

function generateJsonFeed(posts, locale) {
  const meta = LOCALE_META[locale]
  const feedPath = locale === 'ko' ? '/feed.json' : `/feed-${locale}.json`
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: `${SITE_TITLE} (${locale})`,
    home_page_url: `${SITE_URL}/${locale}`,
    feed_url: `${SITE_URL}${feedPath}`,
    description: meta.desc,
    language: meta.iso,
    authors: [{ name: meta.editor, url: `${SITE_URL}/${locale}/about` }],
    items: posts.map((post) => {
      const slug = postSlug(post)
      const url = `${SITE_URL}/${locale}/posts/${slug}`
      return {
        id: url,
        url,
        title: post.title,
        summary: post.description,
        content_text: post.body?.raw ? extractExcerpt(post.body.raw, 2000) : post.description,
        date_published: new Date(post.date).toISOString(),
        tags: post.tags ?? [],
        ...(post.readingTime ? { _reading_time: post.readingTime } : {}),
        ...(post.wordCount ? { _word_count: post.wordCount } : {}),
      }
    }),
  }, null, 2)
}

const allPosts = loadAllPosts()
const outDir = join(process.cwd(), 'out')
mkdirSync(outDir, { recursive: true })

for (const locale of LOCALES) {
  const posts = postsForLocale(allPosts, locale)
  const xmlName = locale === 'ko' ? 'feed.xml' : `feed-${locale}.xml`
  const jsonName = locale === 'ko' ? 'feed.json' : `feed-${locale}.json`
  writeFileSync(join(outDir, xmlName), generateRss(posts, locale))
  writeFileSync(join(outDir, jsonName), generateJsonFeed(posts, locale))
}

console.log(`Generated: out/feed.xml, out/feed.json + per-locale feeds (en, ja, zh, es)`)

// sitemap index — Next.js generateSitemaps()는 /sitemap/{id}.xml만 생성하고
// 정적 export 환경에서는 root /sitemap.xml 인덱스를 만들지 않음. 수동 생성.
const today = new Date().toISOString().split('T')[0]
const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${LOCALES.map((l) => `  <sitemap>
    <loc>${SITE_URL}/sitemap/${l}.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`
writeFileSync(join(outDir, 'sitemap.xml'), sitemapIndex)
console.log(`Generated: out/sitemap.xml (index of 5 per-locale sitemaps)`)
