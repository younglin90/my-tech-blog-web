#!/usr/bin/env node
// 포스트 본문을 청크로 분할 → 간단한 검색 인덱스 생성 (BM25 풍 키워드 점수).
// 결과: src/lib/rag-index.json
//
// 추론 시 워커는 질문에서 키워드 추출 → 인덱스에서 top-k 청크 → 그 청크들을
// Cloudflare Workers AI (Llama 3.1) 프롬프트의 컨텍스트로 넣음.
//
// 임베딩을 안 쓰는 이유: 빌드 비용 0, 워커 메모리 작음. CFD 용어는 키워드 매칭이 잘 됨.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const DIR = 'src/content/posts/ko'   // ko를 source of truth로 사용 (en bot도 ko 인덱스 참조)
const OUT = 'src/lib/rag-index.json'
const PUBLIC_OUT = 'public/rag-index.json'
const CHUNK_SIZE = 400  // words per chunk
const CHUNK_OVERLAP = 80

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w가-힣\s]/g, ' ')
    .split(/\s+/).filter((w) => w.length >= 2)
}

const chunks = []
for (const f of readdirSync(DIR).filter((n) => n.endsWith('.mdx'))) {
  const raw = readFileSync(join(DIR, f), 'utf-8')
  if (/^draft:\s*true/m.test(raw)) continue
  const slug = f.replace(/\.mdx$/, '')
  const titleMatch = raw.match(/^title:\s*"([^"]+)"/m)
  const title = titleMatch ? titleMatch[1] : slug

  // frontmatter 제거 + 본문에서 코드/수식 블록 제거
  let body = raw.replace(/^---[\s\S]*?---\n/, '')
    .replace(/```[\s\S]*?```/g, ' [code] ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' [equation] ')
    .replace(/<[^>]+>/g, '')
    .replace(/!?\[([^\]]*)\]\([^)]+\)/g, '$1')

  const words = body.split(/\s+/).filter(Boolean)
  for (let i = 0; i < words.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    const chunk = words.slice(i, i + CHUNK_SIZE).join(' ')
    if (chunk.length < 100) continue
    chunks.push({
      slug,
      title,
      url: `/posts/${slug}`,
      idx: chunks.length,
      text: chunk,
      tokens: tokenize(chunk),
    })
  }
}

// IDF 사전 계산
const docCount = chunks.length
const docFreq = new Map()
for (const c of chunks) {
  for (const t of new Set(c.tokens)) {
    docFreq.set(t, (docFreq.get(t) ?? 0) + 1)
  }
}
const idf = {}
for (const [t, df] of docFreq) {
  idf[t] = Math.log(1 + (docCount - df + 0.5) / (df + 0.5))
}

// 인덱스 슬림화: tokens는 원본 유지하되 idf 별도 저장
const payload = JSON.stringify({
  meta: { count: chunks.length, generated_at: new Date().toISOString() },
  idf,
  chunks: chunks.map((c) => ({
    slug: c.slug,
    title: c.title,
    idx: c.idx,
    text: c.text,
    tokens: c.tokens,
  })),
}, null, 0)

writeFileSync(OUT, payload)
writeFileSync(PUBLIC_OUT, payload)

console.log(`✅ RAG index: ${chunks.length} chunks, ${Object.keys(idf).length} unique tokens`)
console.log(`   → ${OUT}`)
console.log(`   → ${PUBLIC_OUT} (Worker fetch용)`)
console.log(`   Size: ${(payload.length / 1024).toFixed(1)} KB`)
