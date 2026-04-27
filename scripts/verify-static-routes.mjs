import { existsSync } from 'node:fs'
import { join } from 'node:path'

const OUT_DIR = join(process.cwd(), 'out')
const LOCALES = ['ko', 'en', 'ja', 'zh', 'es']
const requiredFiles = [
  'index.html',
  'sitemap.xml',
  'robots.txt',
  'feed.xml',
  'feed-en.xml',
  'feed-ja.xml',
  'feed-zh.xml',
  'feed-es.xml',
]
const requiredLocaleRoots = LOCALES.map((l) => [join(OUT_DIR, `${l}.html`), join(OUT_DIR, l, 'index.html')])

const missing = requiredFiles.filter((p) => !existsSync(join(OUT_DIR, p)))
for (const candidates of requiredLocaleRoots) {
  if (!candidates.some((p) => existsSync(p))) {
    missing.push(candidates.map((p) => p.replace(`${OUT_DIR}/`, '')).join(' OR '))
  }
}

if (missing.length > 0) {
  console.error('❌ Static route verification failed. Missing files:')
  for (const m of missing) console.error(`  - out/${m}`)
  process.exit(1)
}

console.log(`✅ static routes verified (${requiredFiles.length + requiredLocaleRoots.length} checks)`)
