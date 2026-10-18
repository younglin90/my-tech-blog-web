#!/usr/bin/env node
/**
 * scripts/verify-post-set.mjs — 5개 locale 포스트 세트를 ko 기준으로 대조 검증.
 *
 * 번역 Worker가 각자 검증 스크립트를 짜서 돌리면 그 토큰이 4배로 든다.
 * 검증은 여기 한 곳에서만 한다. Worker는 파일만 쓰고 끝낸다.
 *
 *   node scripts/verify-post-set.mjs 2026-08-10-amr-tagging-and-refluxing
 *   node scripts/verify-post-set.mjs 2026-08-10-...  --run   # python 코드블록 실제 실행까지
 */

import { readFileSync, existsSync, writeFileSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const slug = process.argv[2]
const RUN = process.argv.includes('--run')
if (!slug) {
  console.error('usage: node scripts/verify-post-set.mjs <YYYY-MM-DD-slug> [--run]')
  process.exit(2)
}
const LOCALES = ['ko', 'en', 'ja', 'zh', 'es']
const path = (l) => `src/content/posts/${l}/${slug}.mdx`

const parse = (t) => ({
  fm: Object.fromEntries(
    [...t.split(/^---$/m)[1].matchAll(/^(title|date|description|tags|locale|slug|draft):\s*(.+)$/gm)].map((m) => [m[1], m[2].trim()])
  ),
  math: [...t.matchAll(/\$\$([\s\S]*?)\$\$/g)].map((m) => m[1]),
  fences: [...t.matchAll(/```(\w*)\n([\s\S]*?)```/g)].map((m) => [m[1], m[2]]),
  imports: [...t.matchAll(/^import .*$/gm)].map((m) => m[0]),
  viz: [...t.matchAll(/<([A-Z][A-Za-z0-9]+)\s*\/>/g)].map((m) => m[1]),
  heads: [...t.matchAll(/^## /gm)].length,
  // 첫 코드 블록 이후에 viz가 하나라도 있는지 (실험 재현 viz)
  vizAfterCode: (() => {
    const i = t.indexOf('```text')
    return i >= 0 && /<[A-Z][A-Za-z0-9]+\s*\/>/.test(t.slice(i))
  })(),
  crlf: t.includes('\r\n'),
})

const missing = LOCALES.filter((l) => !existsSync(path(l)))
if (missing.length) {
  console.log(`FAIL  누락 locale: ${missing.join(', ')}`)
  process.exit(1)
}

const src = Object.fromEntries(LOCALES.map((l) => [l, parse(readFileSync(path(l), 'utf-8'))]))
const ko = src.ko
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b)
let bad = 0

for (const l of LOCALES) {
  const p = src[l]
  const fail = []
  if (!eq(p.math, ko.math)) fail.push('math')
  if (!eq(p.fences.map((f) => f[0]), ko.fences.map((f) => f[0]))) fail.push('fence-lang')
  if (!eq(p.fences.filter((f) => f[0] === 'text'), ko.fences.filter((f) => f[0] === 'text'))) fail.push('output-block')
  if (!eq(p.imports, ko.imports)) fail.push('import')
  if (!eq(p.viz, ko.viz)) fail.push('viz')
  if (new Set(p.viz).size < 2) fail.push('viz-2개미만')
  if (!p.vizAfterCode) fail.push('코드뒤-viz없음')
  if (p.heads !== ko.heads) fail.push('section-count')
  if (p.fm.tags !== ko.fm.tags) fail.push('tags')
  if (p.fm.date !== ko.fm.date) fail.push('date')
  if (p.fm.slug !== ko.fm.slug) fail.push('slug')
  if (p.fm.locale !== l) fail.push('locale')
  if (p.fm.draft !== 'false') fail.push('draft')
  if (p.crlf) fail.push('CRLF')
  if (fail.length) bad++
  console.log(`${l}  ${fail.length ? 'FAIL ' + fail.join(',') : 'OK'}`)
}

// post-viz 컴포넌트 파일이 실제로 존재하는지 (import만 있고 파일 없는 사고 방지)
for (const imp of ko.imports) {
  const m = imp.match(/from '(@\/components\/post-viz\/[^']+)'/)
  if (!m) continue
  const f = m[1].replace('@/', 'src/') + '.tsx'
  if (!existsSync(f)) {
    console.log(`FAIL  post-viz 파일 없음: ${f}`)
    bad++
  } else {
    const code = readFileSync(f, 'utf-8')
    const lack = [
      !code.includes('requestAnimationFrame') && 'rAF',
      !/type="range"|type='range'|onPointer|onMouse/.test(code) && 'slider/drag',
      !/onClick/.test(code) && 'button',
    ].filter(Boolean)
    if (lack.length) {
      console.log(`FAIL  조작형 viz 아님 (${lack.join(',')} 없음): ${f}`)
      bad++
    }
  }
}

if (RUN) {
  const dir = mkdtempSync(join(tmpdir(), 'postcheck-'))
  for (const l of LOCALES) {
    const py = src[l].fences.filter((f) => f[0] === 'python').map((f) => f[1])
    const out = py.map((code, i) => {
      const f = join(dir, `${l}_${i}.py`)
      writeFileSync(f, code)
      try {
        return execFileSync('python3', [f], { encoding: 'utf-8', timeout: 120000 }).trim()
      } catch (e) {
        bad++
        return `ERROR ${String(e.stderr ?? e.message).slice(-120)}`
      }
    })
    const same = l === 'ko' || eq(out, globalThis.__koOut)
    if (l === 'ko') globalThis.__koOut = out
    else if (!same) bad++
    console.log(`${l}  python ${py.length}블록 ${out.every((o) => !o.startsWith('ERROR')) ? '실행 OK' : '실행 실패'}${l === 'ko' ? '' : same ? ', ko와 출력 일치' : ', ko와 출력 불일치'}`)
  }
}

console.log(bad ? `\nFAIL (${bad}건)` : '\nPASS — 5 locale 정합')
process.exit(bad ? 1 : 0)
