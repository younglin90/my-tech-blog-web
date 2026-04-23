#!/usr/bin/env node
// 모든 ko 포스트 본문에서 KaTeX 수식($...$, $$...$$) 추출 → LaTeX 토큰 인덱스 생성.
// src/lib/math-manifest.json 으로 저장. Search 모달이 \\nabla 등 검색 시 사용.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'src/content/posts/ko'
const OUT = 'src/lib/math-manifest.json'

const items = []
for (const f of readdirSync(DIR).filter((n) => n.endsWith('.mdx'))) {
  const path = join(DIR, f)
  const slug = f.replace(/\.mdx$/, '')
  const content = readFileSync(path, 'utf-8')
  if (/^draft:\s*true/m.test(content)) continue
  const titleMatch = content.match(/^title:\s*"([^"]+)"/m)
  const title = titleMatch ? titleMatch[1] : slug

  // $$ ... $$ (multiline)
  const blocks = []
  for (const m of content.matchAll(/\$\$([\s\S]*?)\$\$/g)) blocks.push(m[1])
  // $ ... $ (single line, $$ 제외)
  for (const m of content.matchAll(/(?<!\$)\$([^$\n]+)\$(?!\$)/g)) blocks.push(m[1])

  // LaTeX 토큰 (\command) 추출
  const tokens = new Set()
  for (const b of blocks) {
    for (const t of b.matchAll(/\\([a-zA-Z]+)/g)) tokens.add(t[1])
  }

  if (tokens.size === 0) continue
  items.push({
    slug,
    title,
    tokens: Array.from(tokens).sort(),
  })
}

writeFileSync(OUT, JSON.stringify(items, null, 2))
console.log(`✅ math manifest: ${items.length} posts → ${OUT}`)
