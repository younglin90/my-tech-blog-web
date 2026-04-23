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
  const body = content.slice(m[0].length)
  return { title, description, date, draft, tags, body }
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
    })
  }
}

items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))

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
