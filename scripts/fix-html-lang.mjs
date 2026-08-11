#!/usr/bin/env node
/**
 * scripts/fix-html-lang.mjs — 정적 export의 <html lang>을 locale에 맞게 교정
 *
 * App Router에서 <html>은 루트 layout 하나뿐이고, [locale] segment의 layout은 그것을
 * 감쌀 수 없다. 그래서 빌드 결과물은 3,000여 페이지 전부가 <html lang="en">으로 나간다.
 * 지금까지는 LocaleHtmlLang이 hydration 후 useEffect로 고쳐 왔지만, 크롤러와 스크린리더는
 * 최초 HTML을 보므로 한국어 문서가 영어로 선언된 채 색인됐다.
 *
 * next build가 끝난 뒤 out/{locale}/**\/index.html의 lang 속성만 치환한다.
 * out/index.html(루트 리다이렉트 스텁), out/404.html, out/{admin,preview,read}/**는
 * locale segment가 없으므로 en 그대로 둔다.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const OUT = 'out'
const LOCALES = ['ko', 'en', 'ja', 'zh', 'es']

function* htmlFiles(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) yield* htmlFiles(p)
    else if (name.endsWith('.html')) yield p
  }
}

let patched = 0
let skipped = 0

for (const locale of LOCALES) {
  const root = join(OUT, locale)
  if (!existsSync(root)) continue
  for (const file of htmlFiles(root)) {
    const html = readFileSync(file, 'utf-8')
    const next = html.replace(/<html lang="en"/, `<html lang="${locale}"`)
    if (next === html) {
      skipped++
      continue
    }
    writeFileSync(file, next, 'utf-8')
    patched++
  }
  // out/{locale}.html 형태로 떨어지는 경우도 있어 함께 처리
  const flat = join(OUT, `${locale}.html`)
  if (existsSync(flat)) {
    const html = readFileSync(flat, 'utf-8')
    const next = html.replace(/<html lang="en"/, `<html lang="${locale}"`)
    if (next !== html) {
      writeFileSync(flat, next, 'utf-8')
      patched++
    }
  }
}

console.log(`✅ html lang: ${patched} pages localized${skipped ? `, ${skipped} already correct` : ''}`)
