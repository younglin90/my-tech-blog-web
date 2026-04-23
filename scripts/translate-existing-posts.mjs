#!/usr/bin/env node
/**
 * scripts/translate-existing-posts.mjs
 *
 * 기존 src/content/posts/ko/*.mdx 22개를 4개 언어(en, ja, zh, es)로 일괄 번역.
 *
 * 사용법:
 *   export ANTHROPIC_API_KEY=sk-ant-...
 *   node scripts/translate-existing-posts.mjs                # 전체 번역
 *   node scripts/translate-existing-posts.mjs --dry-run      # 비용/대상만 출력, 실제 호출 X
 *   node scripts/translate-existing-posts.mjs --only en      # 특정 locale만
 *   node scripts/translate-existing-posts.mjs --slug X --slug Y  # 특정 slug만
 *   node scripts/translate-existing-posts.mjs --force        # 이미 있는 파일도 덮어씀
 *
 * 동작:
 * - 각 ko 파일을 읽어 frontmatter + 본문을 그대로 Claude에게 보냄
 * - 4개 locale 각각 개별 호출 (병렬 X — rate limit/안정성)
 * - 응답을 src/content/posts/{locale}/{filename}.mdx 에 저장
 * - 이미 존재하면 skip (idempotent), --force 시 덮어씀
 *
 * 비용 추정: 22 × 4 = 88 호출. 평균 입력 4K + 출력 4K 토큰 가정,
 *   Sonnet 4.6 단가($3/M input, $15/M output) → ~$5
 *   Opus 4.7 단가($15/M input, $75/M output) → ~$25
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, basename } from 'node:path'

// ── 설정 ────────────────────────────────────────────────────────────────
const API_KEY = process.env.ANTHROPIC_API_KEY
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6'
const SOURCE_DIR = 'src/content/posts/ko'
const TARGET_LOCALES = ['en', 'ja', 'zh', 'es']
const POSTS_ROOT = 'src/content/posts'

const LOCALE_NAMES = {
  en: 'English',
  ja: '日本語 (Japanese)',
  zh: '简体中文 (Simplified Chinese)',
  es: 'Español (Spanish)',
}

const STYLE_GUIDES = {
  en: 'American English (color/behavior). Technical blog tone — direct, second-person friendly. Avoid clichés like "It is essential to" or "Let us examine".',
  ja: 'です/ます체. 기술 블로그 톤. 영어 차용어는 가타카나로 표기. 클리셰 "〜は不可欠である" 회피.',
  zh: '简体中文 (zh-CN). 技术博客口吻. 中性表达,避免港台用语. 避免老套表达 "...是必不可少的".',
  es: 'Spanish (neutro / LATAM-friendly). 비인칭 표현(se- 또는 명사구) 우선 사용, tú/usted 직접 호칭은 피한다. 클리셰 "Es esencial" 회피.',
}

// ── 인자 파싱 ──────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const flags = {
  dryRun: args.includes('--dry-run'),
  force: args.includes('--force'),
  only: [],
  slugs: [],
}
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--only') flags.only.push(args[++i])
  if (args[i] === '--slug') flags.slugs.push(args[++i])
}

const targetLocales = flags.only.length > 0 ? flags.only : TARGET_LOCALES

// ── 검증 ────────────────────────────────────────────────────────────────
if (!API_KEY && !flags.dryRun) {
  console.error('❌  ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.')
  console.error('    export ANTHROPIC_API_KEY=sk-ant-...')
  process.exit(1)
}

if (!existsSync(SOURCE_DIR)) {
  console.error(`❌  소스 폴더가 없음: ${SOURCE_DIR}`)
  process.exit(1)
}

// ── 파일 수집 ──────────────────────────────────────────────────────────
const allFiles = readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.mdx'))
const targetFiles = flags.slugs.length > 0
  ? allFiles.filter((f) => flags.slugs.some((s) => f.includes(s)))
  : allFiles

if (targetFiles.length === 0) {
  console.error('❌  번역 대상 파일 없음.')
  process.exit(1)
}

// ── 작업 목록 빌드 ──────────────────────────────────────────────────────
const tasks = []
for (const file of targetFiles) {
  for (const locale of targetLocales) {
    const targetPath = join(POSTS_ROOT, locale, file)
    const exists = existsSync(targetPath)
    tasks.push({ file, locale, targetPath, exists, skip: exists && !flags.force })
  }
}

const totalTasks = tasks.length
const skipped = tasks.filter((t) => t.skip).length
const todoTasks = tasks.filter((t) => !t.skip)

console.log(`\n📊 작업 요약`)
console.log(`   소스 ko 파일: ${targetFiles.length}개`)
console.log(`   대상 locale : ${targetLocales.join(', ')}`)
console.log(`   전체 작업   : ${totalTasks}개`)
console.log(`   skip (이미 존재 + no --force): ${skipped}개`)
console.log(`   실제 번역   : ${todoTasks.length}개`)
console.log(`   모델        : ${MODEL}`)

// 비용 추정 (대략)
const avgInputTokens = 4000
const avgOutputTokens = 4500
let costPerMillionInput = 3
let costPerMillionOutput = 15
if (MODEL.includes('opus')) {
  costPerMillionInput = 15
  costPerMillionOutput = 75
}
if (MODEL.includes('haiku')) {
  costPerMillionInput = 0.8
  costPerMillionOutput = 4
}
const estCost =
  todoTasks.length *
  (avgInputTokens * (costPerMillionInput / 1e6) + avgOutputTokens * (costPerMillionOutput / 1e6))
console.log(`   비용 추정   : 약 $${estCost.toFixed(2)} (평균 4K-in / 4.5K-out 가정, ${MODEL})`)

if (flags.dryRun || todoTasks.length === 0) {
  console.log(`\n${flags.dryRun ? '🔍 dry-run' : '✅ 작업 없음'} — 종료.\n`)
  process.exit(0)
}

// ── 번역 함수 ──────────────────────────────────────────────────────────
function buildPrompt(localeKey, koContent) {
  const localeName = LOCALE_NAMES[localeKey]
  const styleGuide = STYLE_GUIDES[localeKey]
  return `당신은 한국어 CFD 기술 블로그 포스트를 ${localeName}로 번역하는 전문 번역가입니다.

## 번역 규칙 (절대 준수)

1. **frontmatter** (\`---\`로 둘러싸인 YAML):
   - \`title\`: 자연스러운 ${localeName} 제목으로 번역. 직역 금지.
   - \`description\`: ${localeName}로 한 문장 요약 (50자/100자 이내).
   - \`tags\`: **그대로 유지** (영문 slug 형태).
   - \`date\`, \`draft\`: **그대로 유지**.
   - 새 필드 추가 금지.

2. **수식 ($...$, $$...$$)**: 절대 번역하지 않는다. 그대로 유지.

3. **코드 블록 (\\\`\\\`\\\`...\\\`\\\`\\\`)**: 코드 자체는 그대로. **주석만** ${localeName}로 번역.

4. **import 구문** (\`import { X } from '...'\`): 그대로 유지.

5. **post-viz 컴포넌트 호출** (\`<Foo />\`): 그대로 유지. props도 변경 금지.

6. **MDX 본문 흐름**:
   - 섹션 헤딩(\`##\`, \`###\`)은 ${localeName}로 자연스럽게 번역.
   - 각 섹션 본문도 직역이 아닌 자연스러운 ${localeName} 문장으로.
   - 비유·도입부 일화는 ${localeName} 독자에게 자연스러운 표현으로 (필요시 현지화 가능).
   - 길이는 한국어 원문 ±20% 범위 유지.

7. **기술 용어**: 국제 표준 사용 (Reynolds, Mach, CFL, Riemann 등 영문 그대로 또는 일반적 번역).

8. **스타일 가이드 (${localeName})**: ${styleGuide}

9. **금지 클리셰** (도입부 첫 문장에 절대 사용 금지):
${
  localeKey === 'en'
    ? '   - "It is essential to...", "Let us examine...", "It is well-known that..."'
    : localeKey === 'ja'
      ? '   - "〜は不可欠である", "〜について見てみよう"'
      : localeKey === 'zh'
        ? '   - "...是必不可少的", "让我们来看看..."'
        : '   - "Es esencial...", "Vamos a ver...", "Es bien sabido que..."'
}

## 출력 형식

번역된 MDX **전체 내용만** 출력하라. 설명·주석·코드 펜스 없이 frontmatter \`---\`부터 시작.

## 한국어 원문

${koContent}`
}

async function callClaude(prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text.slice(0, 300)}`)
  }
  const data = await res.json()
  const content = data.content?.[0]?.text
  if (!content) throw new Error('빈 응답: ' + JSON.stringify(data).slice(0, 200))
  return {
    text: content,
    inputTokens: data.usage?.input_tokens ?? 0,
    outputTokens: data.usage?.output_tokens ?? 0,
  }
}

// ── locale 폴더 준비 ───────────────────────────────────────────────────
for (const locale of targetLocales) {
  mkdirSync(join(POSTS_ROOT, locale), { recursive: true })
}

// ── 실행 (순차, 안정성 우선) ────────────────────────────────────────────
console.log(`\n🚀 번역 시작 (${todoTasks.length}개 작업, 순차 실행)\n`)

let done = 0
let failed = 0
let totalIn = 0
let totalOut = 0
const startTs = Date.now()

for (const task of todoTasks) {
  done++
  const tag = `[${done}/${todoTasks.length}] ${task.locale}/${task.file}`
  process.stdout.write(`${tag} ... `)
  try {
    const koContent = readFileSync(join(SOURCE_DIR, task.file), 'utf-8')
    const prompt = buildPrompt(task.locale, koContent)
    const { text, inputTokens, outputTokens } = await callClaude(prompt)
    writeFileSync(task.targetPath, text)
    totalIn += inputTokens
    totalOut += outputTokens
    console.log(`✅ (in=${inputTokens}, out=${outputTokens})`)
  } catch (err) {
    failed++
    console.log(`❌ ${err.message}`)
  }
}

const elapsed = ((Date.now() - startTs) / 1000).toFixed(1)
const realCost =
  totalIn * (costPerMillionInput / 1e6) + totalOut * (costPerMillionOutput / 1e6)

console.log(`\n📈 완료 (${elapsed}s)`)
console.log(`   성공: ${done - failed} / 실패: ${failed}`)
console.log(`   토큰: in=${totalIn.toLocaleString()}, out=${totalOut.toLocaleString()}`)
console.log(`   실제 비용: 약 $${realCost.toFixed(3)}`)
console.log(`\n다음: git status 로 확인 후 커밋 및 push.`)

if (failed > 0) process.exit(1)
