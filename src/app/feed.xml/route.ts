import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO } from 'date-fns'

const BASE = 'https://tech-blog.dev'

export async function GET() {
  const posts = allPosts
    .filter((p) => !p.draft)
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))

  const items = posts
    .map((p) => {
      const url = `${BASE}/posts/${p._raw.flattenedPath}`
      const tags = (p.tags ?? []).map((t) => `<category>${t}</category>`).join('')
      return `
    <item>
      <title><![CDATA[${p.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description><![CDATA[${p.description ?? ''}]]></description>
      ${tags}
    </item>`
    })
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CFD.Lab</title>
    <link>${BASE}</link>
    <description>CFD 엔지니어를 위한 기술 저널 — 수식, 코드, 인터랙티브 시각화</description>
    <language>ko</language>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
