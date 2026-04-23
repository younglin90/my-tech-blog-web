// Cloudflare Pages Function: CFD-bot RAG endpoint.
// 엔드포인트: POST /api/ask  body { question: string, locale?: string }
//
// 동작:
//   1. question 토큰화 → src/lib/rag-index.json에서 BM25 점수로 top-3 청크 선택
//   2. Cloudflare Workers AI (Llama 3.1 8B Instruct) 호출, 청크를 컨텍스트로 전달
//   3. 답변 + 출처 포스트 슬러그 반환
//
// 환경변수: AI binding (Cloudflare Pages → Settings → Functions → Bindings → AI)
// 또는 fallback으로 외부 OpenAI/Anthropic API 사용 가능 (미구현, 추후 확장).

interface ChunkLite {
  slug: string
  title: string
  idx: number
  text: string
  tokens: string[]
}

interface RagIndex {
  meta: { count: number; generated_at: string }
  idf: Record<string, number>
  chunks: ChunkLite[]
}

interface Env {
  AI?: { run: (model: string, params: any) => Promise<any> }
  ANTHROPIC_API_KEY?: string  // 폴백용 (선택)
}

// 빌드 시 inline import (정적 자산이라 Worker 번들에 포함됨)
// @ts-ignore — Pages Function 컨텍스트에서 fetch
let cachedIndex: RagIndex | null = null
async function loadIndex(): Promise<RagIndex> {
  if (cachedIndex) return cachedIndex
  // 정적 자산 — origin 자기 자신에 fetch
  const res = await fetch('https://cfdblog.cc/rag-index.json')
  cachedIndex = await res.json()
  return cachedIndex!
}

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w가-힣\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2)
}

function score(query: string[], chunk: ChunkLite, idf: Record<string, number>): number {
  // BM25 풍 (k1=1.5, b=0)
  const tf: Record<string, number> = {}
  for (const t of chunk.tokens) tf[t] = (tf[t] ?? 0) + 1
  let s = 0
  for (const q of query) {
    const f = tf[q] ?? 0
    if (!f) continue
    s += (idf[q] ?? 1) * ((f * 2.5) / (f + 1.5))
  }
  return s
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context
  let body: { question?: string; locale?: string }
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid-json' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  const question = (body.question ?? '').trim()
  const locale = body.locale ?? 'en'
  if (!question) {
    return new Response(JSON.stringify({ error: 'no-question' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
  if (question.length > 500) {
    return new Response(JSON.stringify({ error: 'too-long', maxChars: 500 }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const index = await loadIndex()
  const qTokens = tokenize(question)

  const ranked = index.chunks
    .map((c) => ({ chunk: c, s: score(qTokens, c, index.idf) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)

  if (ranked.length === 0) {
    return new Response(JSON.stringify({
      answer: locale === 'ko'
        ? "관련 포스트를 찾지 못했습니다. 더 구체적인 CFD 용어로 다시 시도해주세요."
        : "I couldn't find relevant posts. Try more specific CFD terms.",
      sources: [],
    }), { headers: { 'Content-Type': 'application/json' } })
  }

  const sources = ranked.map((r) => ({ slug: r.chunk.slug, title: r.chunk.title, score: r.s }))
  const context_text = ranked.map((r, i) =>
    `[${i + 1}] ${r.chunk.title}\n${r.chunk.text.slice(0, 800)}`
  ).join('\n\n---\n\n')

  const sysPrompt = locale === 'ko'
    ? `당신은 CFD 전문가입니다. 아래 블로그 포스트 발췌를 근거로 사용자 질문에 한국어로 간결하게 답하세요. 발췌 외 정보는 추측하지 말고 "포스트에 없음"이라고 답하세요. 답변 끝에 [1], [2] 같이 출처 번호를 표시하세요.`
    : `You are a CFD expert. Answer the user's question using only the blog excerpts below. If information is not in the excerpts, say "not found in posts". Cite sources as [1], [2] at the end.`

  const userPrompt = `## Excerpts\n\n${context_text}\n\n## Question\n${question}`

  // Cloudflare Workers AI 호출
  if (!env.AI) {
    return new Response(JSON.stringify({
      error: 'ai-binding-missing',
      hint: 'Cloudflare Pages → Settings → Functions → Bindings → Workers AI: bind as AI',
      sources,
    }), { status: 503, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const aiRes = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 600,
      temperature: 0.3,
    })
    const answer = aiRes?.response ?? aiRes?.result?.response ?? String(aiRes)
    return new Response(JSON.stringify({ answer, sources }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'ai-failed', detail: e.message ?? String(e), sources }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
