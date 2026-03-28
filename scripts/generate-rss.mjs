import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

const SITE_URL = 'https://tech-blog.dev'
const SITE_TITLE = 'CFD.Lab'
const SITE_DESCRIPTION = 'CFD 엔지니어를 위한 기술 저널 — 수식, 코드, 인터랙티브 시각화'

function getPosts() {
  const raw = readFileSync(join(process.cwd(), '.contentlayer/generated/Post/_index.json'), 'utf-8')
  return JSON.parse(raw)
    .filter((p) => !p.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

function generateRss(posts) {
  const items = posts.map((post) => {
    const categories = (post.tags ?? []).map((t) => `      <category>${t}</category>`).join('\n')
    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.description}]]></description>
      <link>${SITE_URL}/posts/${post._raw.flattenedPath}</link>
      <guid isPermaLink="true">${SITE_URL}/posts/${post._raw.flattenedPath}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>${categories ? '\n' + categories : ''}
    </item>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_TITLE}</title>
    <description>${SITE_DESCRIPTION}</description>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`
}

function generateSitemap(posts) {
  const postEntries = posts.map((post) => `
  <url>
    <loc>${SITE_URL}/posts/${post._raw.flattenedPath}</loc>
    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
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
  </url>${postEntries}
</urlset>`
}

const posts = getPosts()

mkdirSync(join(process.cwd(), 'out'), { recursive: true })
writeFileSync(join(process.cwd(), 'out/feed.xml'), generateRss(posts))
writeFileSync(join(process.cwd(), 'out/sitemap.xml'), generateSitemap(posts))
console.log('Generated: out/feed.xml, out/sitemap.xml')
