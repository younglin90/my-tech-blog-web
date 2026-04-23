import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const SITE_URL = 'https://tech-blog.dev'
const SITE_TITLE = 'CFD.Lab'
const SITE_DESCRIPTION = 'CFD 엔지니어를 위한 기술 저널 — 수식, 코드, 인터랙티브 시각화'

function getPosts() {
  const raw = readFileSync(join(process.cwd(), '.contentlayer/generated/Post/_index.json'), 'utf-8')
  // RSS는 ko 포스트만 노출 (locale별 RSS는 후속 작업)
  return JSON.parse(raw)
    .filter((p) => !p.draft && (p.locale === 'ko' || !p.locale))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

const POST_PATH = (p) => `/ko/posts/${p.slug || (p._raw?.flattenedPath ?? '').replace(/^ko\//, '')}`

/** Strip MDX/JSX/frontmatter for a plain-text excerpt */
function extractExcerpt(raw, maxChars = 1500) {
  const text = raw
    .replace(/^---[\s\S]*?---/, '')           // remove frontmatter
    .replace(/<[^>]+>/g, '')                   // strip JSX/HTML tags
    .replace(/```[\s\S]*?```/g, '[code block]') // replace code blocks
    .replace(/\$\$[\s\S]*?\$\$/g, '[equation]') // replace display math
    .replace(/\$[^$]+\$/g, '[math]')            // replace inline math
    .replace(/!\[.*?\]\(.*?\)/g, '')            // remove images
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')   // unwrap links
    .replace(/#{1,6}\s+/g, '')                  // remove heading markers
    .replace(/[*_`~]/g, '')                     // remove emphasis markers
    .replace(/\n{3,}/g, '\n\n')                // collapse excessive newlines
    .trim()
  return text.length > maxChars ? text.slice(0, maxChars) + '…' : text
}

function generateRss(posts) {
  const items = posts.map((post) => {
    const categories = (post.tags ?? []).map((t) => `      <category>${t}</category>`).join('\n')
    const meta = [post.readingTime, post.wordCount ? `${post.wordCount.toLocaleString()} words` : null]
      .filter(Boolean).join(' · ')
    const excerpt = post.body?.raw ? extractExcerpt(post.body.raw) : post.description
    const desc = meta ? `${post.description}\n\n[${meta}]` : post.description
    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${desc}]]></description>
      <content:encoded><![CDATA[${excerpt}

---
Read more: ${SITE_URL}${POST_PATH(post)}]]></content:encoded>
      <link>${SITE_URL}${POST_PATH(post)}</link>
      <guid isPermaLink="true">${SITE_URL}${POST_PATH(post)}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>noreply@tech-blog.dev (CFD.Lab)</author>${categories ? '\n' + categories : ''}
    </item>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${SITE_TITLE}</title>
    <description>${SITE_DESCRIPTION}</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <language>ko</language>
    <managingEditor>noreply@tech-blog.dev (CFD.Lab)</managingEditor>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>1440</ttl>${items}
  </channel>
</rss>`
}

function generateSitemap(posts) {
  const postEntries = posts.map((post) => `
  <url>
    <loc>${SITE_URL}${POST_PATH(post)}</loc>
    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')

  // Collect unique tags
  const tags = [...new Set(posts.flatMap((p) => p.tags ?? []))]
  const tagEntries = tags.map((tag) => `
  <url>
    <loc>${SITE_URL}/tags/${encodeURIComponent(tag)}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`).join('')

  const today = new Date().toISOString().split('T')[0]
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${SITE_URL}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${SITE_URL}/tags</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>${postEntries}${tagEntries}
</urlset>`
}

function generateJsonFeed(posts) {
  return JSON.stringify({
    version: 'https://jsonfeed.org/version/1.1',
    title: SITE_TITLE,
    home_page_url: SITE_URL,
    feed_url: `${SITE_URL}/feed.json`,
    description: SITE_DESCRIPTION,
    language: 'ko',
    authors: [{ name: 'CFD.Lab', url: `${SITE_URL}/about` }],
    items: posts.map((post) => ({
      id: `${SITE_URL}${POST_PATH(post)}`,
      url: `${SITE_URL}${POST_PATH(post)}`,
      title: post.title,
      summary: post.description,
      content_text: post.body?.raw ? extractExcerpt(post.body.raw, 2000) : post.description,
      date_published: new Date(post.date).toISOString(),
      tags: post.tags ?? [],
      ...(post.readingTime ? { _reading_time: post.readingTime } : {}),
      ...(post.wordCount ? { _word_count: post.wordCount } : {}),
    })),
  }, null, 2)
}

const posts = getPosts()

mkdirSync(join(process.cwd(), 'out'), { recursive: true })
writeFileSync(join(process.cwd(), 'out/feed.xml'), generateRss(posts))
writeFileSync(join(process.cwd(), 'out/feed.json'), generateJsonFeed(posts))
// sitemap.xml is generated natively by src/app/sitemap.ts (Next.js static export)
console.log('Generated: out/feed.xml, out/feed.json')
