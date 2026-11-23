import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'

const rules = JSON.parse(readFileSync(new URL('../public/_routes.json', import.meta.url), 'utf8'))

// Exact or terminal wildcard prefix rules. Exclusions override inclusions.
const matches = (rule, path) => rule.endsWith('*') ? path.startsWith(rule.slice(0, -1)) : path === rule
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

test('locale middleware still sees root and supported legacy paths', () => {
  assert.equal(invokes('/'), true)
  for (const segment of ['posts', 'series', 'tags', 'tools', 'about', 'bookmarks', 'glossary', 'privacy', 'viz']) {
    assert.equal(invokes('/' + segment), true, segment)
    assert.equal(invokes('/' + segment + '/'), true, segment)
  }
  for (const segment of ['posts', 'series', 'tags', 'tools']) {
    assert.equal(invokes('/' + segment + '/example/'), true, segment)
  }
})

test('admin auth and every checked-in Pages API remain routed through Functions', () => {
  const directory = new URL('../functions/', import.meta.url)
  const entries = readdirSync(directory, { recursive: true, withFileTypes: true })
  const paths = entries.filter(entry => entry.isFile() && entry.name.endsWith('.ts') && !entry.name.startsWith('_'))
    .map(entry => resolve(entry.parentPath ?? entry.path, entry.name).slice(resolve(directory.pathname).length, -3).replaceAll('\\', '/'))
  assert.ok(paths.length >= 11)
  for (const path of paths) {
    assert.equal(invokes(path), true, path)
    assert.equal(invokes(path + '/'), true, path)
  }
  for (const path of ['/admin', '/admin/', '/admin.html', '/admin.txt',
    '/admin/index.html', '/admin/index.txt', '/admin/__next._full.txt', '/admin.__next.txt']) {
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
    '/sitemap.xml', '/sitemap/ko.xml', '/robots.txt', '/post-index.json', '/rag-index.json', '/favicon.ico',
    '/read/', '/preview/disabled/', '/unknown-path', '/unexpected/file.js', '/api/unknown', '/api/visitors/unknown']) {
    assert.equal(invokes(path), false, path)
  }
})

test('the service worker lets visits reuse the server HTTP TTL, not a service-worker cache', () => {
  const handlers = {}
  const network = []
  const origin = 'https://example.test'
  runInNewContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8'), {
    URL,
    self: { location: { origin }, addEventListener: (event, handler) => { handlers[event] = handler } },
    fetch: (request, init) => { network.push(init.cache); return Promise.resolve() },
  })
  const request = (path, method = 'GET') => {
    let intercepted = false
    handlers.fetch({ request: new Request(origin + path, { method }), respondWith: () => { intercepted = true } })
    return intercepted
  }
  assert.equal(request('/api/visitors'), false)
  assert.equal(request('/api/pageview', 'POST'), false)
  assert.equal(request('/api/post-stats'), true)
  assert.equal(request('/sitemap/ko.xml'), true)
  assert.deepEqual(network, ['no-store', 'no-store'])
})

// npm run build calls this after Next export. Bare unit tests may omit out/.
if (process.env.CHECK_BUILD_OUTPUT === '1' || existsSync(resolve('out'))) {
  test('Next export includes the exact Pages routing config', () => {
    const buildRoutes = JSON.parse(readFileSync(resolve('out/_routes.json'), 'utf8'))
    assert.deepEqual(buildRoutes, rules)
  })
  test('all exported admin documents and payloads remain behind Functions', () => {
    const out = resolve('out')
    const entries = readdirSync(out, { recursive: true, withFileTypes: true })
    const root = out.length + 1
    const files = entries.filter(entry => entry.isFile())
      .map(entry => resolve(entry.parentPath ?? entry.path, entry.name).slice(root).replaceAll('\\', '/'))
      .filter(file => file.startsWith('admin/') || file.startsWith('admin.'))
    assert.ok(files.some(file => file === 'admin/index.html' || file === 'admin.html'))
    for (const file of files) assert.equal(invokes('/' + file), true, file)
  })
}
