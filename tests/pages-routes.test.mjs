import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'

const rules = JSON.parse(readFileSync(new URL('../public/_routes.json', import.meta.url), 'utf8'))

// Paths here use exact rules or terminal /*. Exclusions override inclusions.
const matches = (rule, path) => rule.endsWith('/*') ? path.startsWith(rule.slice(0, -1)) : path === rule
const invokes = path => rules.include.some(rule => matches(rule, path)) &&
  !rules.exclude.some(rule => matches(rule, path))

test('Pages route config is within platform constraints', () => {
  assert.equal(rules.version, 1)
  assert.ok(rules.include.length >= 1)
  assert.ok(rules.include.length + rules.exclude.length <= 100)
  for (const rule of [...rules.include, ...rules.exclude]) {
    assert.ok(rule.startsWith('/') && rule.length <= 100)
    assert.match(rule, /^\/[^*]*(?:\*)?$/)
  }
})

test('locale middleware still sees root, unlocalized and unknown paths', () => {
  for (const path of ['/', '/posts/example', '/tags/numerics', '/unknown-path']) {
    assert.equal(invokes(path), true, path)
  }
})

test('admin auth and every checked-in Pages API remain routed through Functions', () => {
  const apis = []
  for (const prefix of ['api', 'admin/api']) {
    const directory = new URL('../functions/' + prefix + '/', import.meta.url)
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.ts')) {
        apis.push('/' + prefix + '/' + entry.name.slice(0, -3))
      }
    }
  }
  assert.ok(apis.length >= 11)
  for (const path of ['/admin', '/admin/', '/admin.html', '/admin.txt',
    '/admin/index.html', '/admin/index.txt', '/admin/__next._full.txt', ...apis]) {
    assert.equal(invokes(path), true, path)
  }
})

test('localized content and common static assets bypass Functions', () => {
  for (const locale of ['ko', 'en', 'ja', 'zh', 'es']) {
    for (const path of ['/' + locale, '/' + locale + '/', '/' + locale + '/posts/example/',
      '/' + locale + '/not-found', '/feed-' + locale + '.xml']) {
      assert.equal(invokes(path), false, path)
    }
  }
  for (const path of ['/_next/static/chunks/main.js', '/katex/fonts/sample.woff2',
    '/sitemap.xml', '/robots.txt', '/post-index.json', '/rag-index.json', '/favicon.ico']) {
    assert.equal(invokes(path), false, path)
  }
})

if (process.env.CHECK_BUILD_OUTPUT === '1') {
  test('Next export includes the exact Pages routing config', () => {
    const buildRoutes = JSON.parse(readFileSync(resolve('out/_routes.json'), 'utf8'))
    assert.deepEqual(buildRoutes, rules)
  })
}
