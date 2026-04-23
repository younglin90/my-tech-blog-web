#!/usr/bin/env node
/**
 * scripts/build-summaries.mjs
 *
 * 각 ko 포스트에서 자동 요약 3줄을 추출. 두 가지 모드:
 *   1. ANTHROPIC_API_KEY 있음 → Claude로 핵심 3줄 요약 (정확)
 *   2. 없음 → 첫 두 단락에서 첫 문장씩 휴리스틱 추출 (폴백)
 *
 * 결과: src/lib/summaries.json
 *   { slug: { summary: "...", method: "llm"|"heuristic" } }
 *
 * Search 모달과 RSS description 보강에 사용.
 *
 * 캐시: 같은 본문 hash면 재요약 안 함 (LLM 비용 절감).
 */

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

const DIR = 'src/content/posts/ko'
const OUT = 'src/lib/summaries.json'
const API_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'  // 가장 저렴한 모델

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf-8')) : {}
const next = {}

function bodyOf(raw) {
  return raw
    .replace(/^---[\s\S]*?---\n/, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, '')
    .replace(/<[^>]+>/g, '')
}

function heuristic(body) {
  const paras = body.split(/\n\n+/).map((p) => p.trim()).filter((p) => p && !p.startsWith('#'))
  // 처음 2개 단락의 첫 문장
  const sents = []
  for (const p of paras.slice(0, 4)) {
    const first = p.split(/[.!?。]/)[0].trim()
    if (first.length > 10) sents.push(first + '.')
    if (sents.length >= 3) break
  }
  return sents.join(' ')
}

async function llmSummarize(title, body) {
  const prompt = `다음 한국어 CFD 블로그 포스트를 핵심 3줄(각 60자 이내)로 요약해. 줄바꿈으로 구분.

제목: ${title}

본문:
${body.slice(0, 6000)}

요약:`
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.content?.[0]?.text?.trim() ?? ''
}

const files = readdirSync(DIR).filter((n) => n.endsWith('.mdx'))
let llmCalls = 0, cached = 0

for (const f of files) {
  const slug = f.replace(/\.mdx$/, '')
  const raw = readFileSync(join(DIR, f), 'utf-8')
  if (/^draft:\s*true/m.test(raw)) continue
  const titleMatch = raw.match(/^title:\s*"([^"]+)"/m)
  const title = titleMatch ? titleMatch[1] : slug
  const body = bodyOf(raw)
  const hash = createHash('md5').update(body).digest('hex').slice(0, 12)

  // 캐시 확인 — 본문 hash 같으면 재사용
  if (previous[slug]?.hash === hash) {
    next[slug] = previous[slug]
    cached++
    continue
  }

  let summary = ''
  let method = 'heuristic'
  if (API_KEY) {
    try {
      summary = await llmSummarize(title, body)
      method = 'llm'
      llmCalls++
    } catch (e) {
      console.warn(`  LLM 실패 (${slug}): ${e.message}, 휴리스틱 폴백`)
    }
  }
  if (!summary) {
    summary = heuristic(body)
  }
  next[slug] = { summary, method, hash }
  console.log(`  [${method}] ${slug}: ${summary.slice(0, 60)}...`)
}

writeFileSync(OUT, JSON.stringify(next, null, 2))
console.log(`\n✅ summaries: ${Object.keys(next).length} (${cached} cached, ${llmCalls} new LLM calls) → ${OUT}`)
if (!API_KEY) console.log(`   ANTHROPIC_API_KEY 미설정 — 모두 휴리스틱 모드. 정밀 요약 원하면 환경변수 등록.`)
