import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'

const root = new URL('../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const curation = JSON.parse(read('src/components/featured-cfd.json'))
const locales = ['ko', 'en', 'ja', 'zh', 'es']

test('curated CFD cases are published and paired with evidence in every locale', () => {
  assert.deepEqual(Object.keys(curation.locales).sort(), [...locales].sort())
  assert.equal(curation.slugs.length, 4)
  assert.equal(new Set(curation.slugs).size, curation.slugs.length)
  for (const locale of locales) {
    const copy = curation.locales[locale]
    assert.equal(copy.entries.length, curation.slugs.length)
    for (const [i, slug] of curation.slugs.entries()) {
      assert.equal(copy.entries[i].length, 2)
      assert.ok(copy.entries[i].every(text => text.trim()))
      const mdx = read(`src/content/posts/${locale}/${slug}.mdx`)
      assert.match(mdx, /^draft: false\s*$/m)
      assert.match(mdx, /^\x60{3}python\s*$/m)
    }
  }
})

test('ownership remains available without a site-wide ad loader', () => {
  const layout = read('src/app/layout.tsx')
  assert.match(layout, /google-adsense-account/)
  assert.doesNotMatch(layout, /adsbygoogle\.js|adsense-loader/)
})

if (process.env.CHECK_BUILD_OUTPUT === '1' || existsSync(new URL('out/', root))) {
  test('static pages expose curated links and match ads.txt without loading ads', () => {
    const ads = read('out/ads.txt')
    const publisher = ads.match(/^google\.com, (pub-\d{16}), DIRECT, f08c47fec0942fa0\s*$/)?.[1]
    assert.ok(publisher, 'missing authorized ads.txt record')
    const ownership = `<meta name="google-adsense-account" content="ca-${publisher}"`
    for (const locale of locales) {
      const home = read(`out/${locale}/index.html`)
      assert.ok(home.includes('id="featured-cfd-title"'), locale)
      assert.ok(home.includes(`href="/${locale}/about/#editorial-practice"`), locale)
      assert.ok(home.includes(ownership), locale)
      assert.doesNotMatch(home, /adsbygoogle\.js/)
      const about = read(`out/${locale}/about/index.html`)
      assert.ok(about.includes('id="editorial-practice"'), locale)
      assert.doesNotMatch(about, /adsbygoogle\.js/)
      for (const slug of curation.slugs) {
        assert.ok(home.includes(`href="/${locale}/posts/${slug}/"`), slug)
        const article = read(`out/${locale}/posts/${slug}/index.html`)
        assert.ok(article.includes(ownership), slug)
        assert.doesNotMatch(article, /adsbygoogle\.js/)
      }
    }
  })
}
