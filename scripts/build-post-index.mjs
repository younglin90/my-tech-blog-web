import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const POSTS_ROOT = join(process.cwd(), 'src/content/posts')
const LOCALES = ['ko', 'en', 'ja', 'zh', 'es']
const OUT_LIB = join(process.cwd(), 'src/lib/post-index.json')
const OUT_PUBLIC = join(process.cwd(), 'public/post-index.json')

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  const fm = m[1]
  const title = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? ''
  const description = fm.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? ''
  const date = fm.match(/^date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*$/m)?.[1] ?? ''
  const draft = (fm.match(/^draft:\s*(true|false)\s*$/m)?.[1] ?? 'false') === 'true'
  const tagRaw = fm.match(/^tags:\s*\[([^\]]*)\]\s*$/m)?.[1] ?? ''
  const tags = tagRaw
    .split(',')
    .map((s) => s.trim().replace(/^['"]|['"]$/g, ''))
    .filter(Boolean)
  // 옵션 필드 — series, seriesOrder, updated. 검색·LinkPreview·sitemap에 활용
  const series = fm.match(/^series:\s*["']?([^"'\n]+)["']?\s*$/m)?.[1]?.trim()
  const seriesOrderRaw = fm.match(/^seriesOrder:\s*(\d+)\s*$/m)?.[1]
  const seriesOrder = seriesOrderRaw ? Number(seriesOrderRaw) : undefined
  const updated = fm.match(/^updated:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*$/m)?.[1]
  const body = content.slice(m[0].length)
  return { title, description, date, draft, tags, series, seriesOrder, updated, body }
}

function readingTimeFromBody(body) {
  const tokenRe = /[A-Za-z0-9\u00C0-\u024F\u3040-\u30FF\u4E00-\u9FFF\uAC00-\uD7AF]+/g
  const words = (body.match(tokenRe) ?? []).length
  const mins = Math.max(1, Math.round(words / 220))
  return `${mins} min read`
}

const items = []
for (const locale of LOCALES) {
  const dir = join(POSTS_ROOT, locale)
  let files = []
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.mdx'))
  } catch {
    continue
  }
  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '')
    const raw = readFileSync(join(dir, file), 'utf-8')
    const parsed = parseFrontmatter(raw)
    if (!parsed || !parsed.title || !parsed.date) continue
    items.push({
      slug,
      locale,
      title: parsed.title,
      date: parsed.date,
      description: parsed.description,
      tags: parsed.tags,
      draft: parsed.draft,
      url: `/${locale}/posts/${slug}`,
      readingTime: readingTimeFromBody(parsed.body),
      // 옵션 필드 — undefined는 JSON에서 자동 생략
      series: parsed.series,
      seriesOrder: parsed.seriesOrder,
      updated: parsed.updated,
    })
  }
}

items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

// --- 불변식 검사 ---------------------------------------------------------
// 여기서 막지 않으면 posts/[slug]/page.tsx의 ko fallback이 조용히 동작해서,
// 한국어 본문이 5개 URL에 각각 다른 언어를 선언한 채 색인된다.
{
  const LOCALES = ['ko', 'en', 'ja', 'zh', 'es']
  const bySlug = new Map()
  for (const it of items) {
    if (!bySlug.has(it.slug)) bySlug.set(it.slug, new Set())
    bySlug.get(it.slug).add(it.locale)
  }
  const gaps = []
  for (const [slug, locs] of bySlug) {
    const missing = LOCALES.filter((l) => !locs.has(l))
    if (missing.length) gaps.push(`  ${slug}: ${missing.join(', ')} 누락`)
  }

  // 태그 정규화(scripts/normalize-tags.mjs)를 되돌리지 못하게 고정한다.
  const badTags = new Set()
  for (const it of items) {
    for (const tg of it.tags ?? []) {
      if (/[^\x00-\x7F]/.test(tg) || /\s/.test(tg)) badTags.add(tg)
    }
  }

  if (gaps.length || badTags.size) {
    console.error('❌ post index 불변식 위반:')
    if (gaps.length) {
      console.error(`  locale 누락 ${gaps.length}건 — 5개 locale이 모두 있어야 합니다`)
      for (const g of gaps.slice(0, 10)) console.error(g)
    }
    if (badTags.size) {
      console.error(`  비ASCII/공백 태그: ${[...badTags].join(', ')}`)
      console.error('  → node scripts/normalize-tags.mjs 로 정규화하세요')
    }
    process.exit(1)
  }
}

const out = {
  meta: {
    generatedAt: new Date().toISOString(),
    count: items.length,
  },
  items,
}

mkdirSync(join(process.cwd(), 'src/lib'), { recursive: true })
mkdirSync(join(process.cwd(), 'public'), { recursive: true })
writeFileSync(OUT_LIB, JSON.stringify(out, null, 2))
writeFileSync(OUT_PUBLIC, JSON.stringify(out, null, 2))

console.log(`✅ post index: ${items.length} items -> src/lib/post-index.json, public/post-index.json`)
