import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { after, test } from 'node:test'
import ts from 'typescript'

// Compile only the Pages handlers used here (also works on CI's Node 20).
const root = mkdtempSync(join(tmpdir(), 'cfdblog-visitor-test-'))
after(() => rmSync(root, { recursive: true, force: true }))
for (const file of ['functions-lib/guard', 'functions/api/pageview', 'functions/api/visitors']) {
  const source = readFileSync(new URL('../' + file + '.ts', import.meta.url), 'utf8')
  const dest = join(root, file + '.js')
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText)
}
const require = createRequire(import.meta.url)
const { onRequestPost } = require(join(root, 'functions/api/pageview.js'))
const { onRequestGet } = require(join(root, 'functions/api/visitors.js'))
const { kstDay } = require(join(root, 'functions-lib/guard.js'))

test('site counts still reach the footer when the per-post index is unavailable', async (t) => {
  t.mock.method(console, 'error', () => {})
  const deferred = []
  const seen = new Set()
  const daily = new Map()
  let total = { visitors: 9, pageviews: 20 }
  const db = {
    prepare(sql) {
      return { sql, values: [], bind(...values) { return { sql, values } } }
    },
    async batch(statements) {
      return statements.map(({ sql, values }) => {
        const result = (results = [], changes = 0) => ({ results, meta: { changes } })
        if (sql.startsWith('INSERT OR IGNORE INTO seen')) {
          const key = JSON.stringify(values)
          if (seen.has(key)) return result()
          seen.add(key)
          return result([], 1)
        }
        if (sql.startsWith('INSERT INTO visit_daily')) {
          const [day, visitors] = values
          const row = daily.get(day) ?? { day, visitors: 0, pageviews: 0 }
          row.visitors += visitors
          row.pageviews += 1
          daily.set(day, row)
        }
        if (sql.startsWith('UPDATE visit_total')) {
          total = { visitors: total.visitors + values[0], pageviews: total.pageviews + 1 }
        }
        if (sql.startsWith('SELECT day,')) return result(values.map((day) => daily.get(day)).filter(Boolean))
        if (sql.startsWith('SELECT visitors,')) return result([total])
        assert.ok(!sql.startsWith('INSERT INTO post_'), 'unknown post must not add per-post stats')
        return result()
      })
    },
  }
  const env = { DB: db, ASSETS: { fetch: async () => { throw new Error('index unavailable') } } }
  const waitUntil = (promise) => deferred.push(promise)
  const day = kstDay()
  daily.set(kstDay(-1), { day: kstDay(-1), visitors: 2, pageviews: 3 })
  for (let i = 0; i < 2; i++) {
    const request = new Request('https://example.test/api/pageview', {
      method: 'POST',
      body: JSON.stringify({ path: '/ko/posts/test-article/' }),
      headers: { Origin: 'https://example.test', 'User-Agent': 'Mozilla/5.0 test browser for statistics' },
    })
    assert.equal((await onRequestPost({ request, env, waitUntil })).status, 204)
    await Promise.all(deferred.splice(0))
  }
  assert.equal(daily.get(day)?.visitors, 1)
  const res = await onRequestGet({ request: new Request('https://example.test/api/visitors'), env, waitUntil })
  assert.equal(res.status, 200)
  const counts = await res.json()
  assert.deepEqual(counts.today, { visitors: 1, pageviews: 1 })
  assert.equal(counts.yesterday.visitors, 2)
  assert.deepEqual(counts.total, { visitors: 10, pageviews: 21 })
})
