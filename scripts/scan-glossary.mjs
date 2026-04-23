#!/usr/bin/env node
// source-docs/glossary.yaml 파싱 → src/lib/glossary.json 생성.
// 빌드 시 실행. JSON으로 변환해 클라이언트에서 import 가능하게.

import { readFileSync, writeFileSync } from 'node:fs'

const SRC = 'source-docs/glossary.yaml'
const OUT = 'src/lib/glossary.json'

const raw = readFileSync(SRC, 'utf-8')

// 매우 단순한 YAML 파서 (terms: 한 단계 nested만 지원).
const result = {}
let currentKey = null
let currentEntry = null
let inTerms = false

for (const line of raw.split('\n')) {
  // comment / empty
  if (/^\s*#/.test(line) || !line.trim()) continue
  if (line.startsWith('terms:')) {
    inTerms = true
    continue
  }
  if (!inTerms) continue

  // 2-space indent: 새 용어 시작
  const termStart = line.match(/^  ([A-Za-z][\w]*?):\s*$/)
  if (termStart) {
    currentKey = termStart[1]
    currentEntry = { ko: '', en: '', wiki: '' }
    result[currentKey] = currentEntry
    continue
  }

  // 4-space indent: 필드
  const field = line.match(/^    (ko|en|wiki):\s*"?(.*?)"?\s*$/)
  if (field && currentEntry) {
    const [, key, val] = field
    currentEntry[key] = val
  }
}

writeFileSync(OUT, JSON.stringify(result, null, 2))
console.log(`✅ glossary: ${Object.keys(result).length} terms → ${OUT}`)
