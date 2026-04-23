#!/usr/bin/env node
/**
 * scripts/validate-post.mjs
 *
 * 자동 생성/수동 작성된 MDX 포스트의 품질 게이트.
 * pre-commit hook에서 staged된 .mdx 파일 검사 또는 수동으로:
 *
 *   node scripts/validate-post.mjs path/to/post.mdx [more.mdx ...]
 *   node scripts/validate-post.mjs --staged   # git에 staged된 *.mdx 자동 수집
 *   node scripts/validate-post.mjs --all      # src/content/posts/ 전체
 *
 * 종료 코드:
 *   0 = 모두 통과
 *   1 = 하나 이상 실패 (pre-commit이 차단)
 *
 * 검사 항목:
 *   1. frontmatter 필수 필드 (title, date, description, tags)
 *   2. viz 컴포넌트 ≥ 1 (post-viz import 또는 pre-built 컴포넌트 사용)
 *   3. 코드블록에 언어 명시 (` ``` ` 만 있고 lang 없으면 fail)
 *   4. KaTeX 멀티라인 블록 수식: $$가 같은 줄에 본문과 같이 있는 경우 (파서 오염 위험)
 *   5. 도입부 첫 문장 클리셰 검사 (locale별)
 *   6. 섹션(`##`) 헤딩 1개 이상
 */

import { readFileSync, statSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { glob } from 'node:fs/promises'  // node 22+ 지원, 미지원 시 폴백 아래 readdir 사용
import { join, basename } from 'node:path'

const args = process.argv.slice(2)
const STAGED = args.includes('--staged')
const ALL = args.includes('--all')

let files = args.filter((a) => !a.startsWith('--'))
if (STAGED) {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACMR', { encoding: 'utf-8' })
    files = out.split('\n').filter((f) => f.endsWith('.mdx'))
  } catch {
    console.error('git diff 실행 실패. git 저장소 안에서 실행하세요.')
    process.exit(2)
  }
}
if (ALL) {
  // 간단한 동기 walk
  const fs = await import('node:fs')
  const path = await import('node:path')
  function walk(dir) {
    const out = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name)
      if (entry.isDirectory()) out.push(...walk(p))
      else if (entry.isFile() && p.endsWith('.mdx')) out.push(p)
    }
    return out
  }
  files = walk('src/content/posts')
}

if (files.length === 0) {
  console.log('검사할 .mdx 파일이 없습니다.')
  process.exit(0)
}

// ── 클리셰 정의 ─────────────────────────────────────────
const CLICHES = {
  ko: ['~는 필수적이다', '~를 살펴본다', '~의 기본이 된다', '~는 빠질 수 없는', '~의 핵심은 ~이다'],
  en: ['It is essential to', 'Let us examine', 'It is well-known that'],
  ja: ['は不可欠である', 'について見てみよう'],
  zh: ['是必不可少的', '让我们来看看'],
  es: ['Es esencial', 'Vamos a ver', 'Es bien sabido que'],
}

const VIZ_NAMES = ['VelocityField', 'StreamLine', 'NumericalScheme', 'PressureContour', 'BoundaryCondition', 'NumericalDungeon', 'MachArchitect']

// ── 검사 ──────────────────────────────────────────────
let totalFailed = 0
const allErrors = []

for (const file of files) {
  const errors = []
  let content
  try {
    content = readFileSync(file, 'utf-8')
  } catch (e) {
    errors.push(`파일 읽기 실패: ${e.message}`)
    allErrors.push({ file, errors })
    totalFailed++
    continue
  }

  // 1. frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!fmMatch) {
    errors.push('frontmatter (--- ... ---) 없음')
    allErrors.push({ file, errors })
    totalFailed++
    continue
  }
  const fm = fmMatch[1]
  const body = fmMatch[2]

  for (const required of ['title', 'date', 'description']) {
    if (!new RegExp(`^${required}:`, 'm').test(fm)) {
      errors.push(`frontmatter에 ${required} 필드 없음`)
    }
  }

  // locale 추론 (폴더명 기반)
  const localeMatch = file.match(/posts\/(ko|en|ja|zh|es)\//)
  const locale = localeMatch?.[1] ?? 'ko'

  // 2. viz 컴포넌트 ≥ 1
  const hasPreBuilt = VIZ_NAMES.some((name) => new RegExp(`<${name}[\\s/>]`).test(body))
  const hasPostVizImport = /from ['"]@\/components\/post-viz\//.test(content)
  if (!hasPreBuilt && !hasPostVizImport) {
    errors.push('viz 컴포넌트 0개 — post-viz custom 또는 pre-built(VelocityField 등) 1개 이상 필요')
  }

  // 3. 코드블록 언어 명시 (opening fence만 검사; closing fence는 lang 불필요)
  {
    let inBlock = false
    let langlessOpens = 0
    for (const line of body.split('\n')) {
      if (/^```/.test(line)) {
        if (!inBlock) {
          if (/^```\s*$/.test(line)) langlessOpens++
          inBlock = true
        } else {
          inBlock = false
        }
      }
    }
    if (langlessOpens > 0) {
      errors.push(`코드블록 ${langlessOpens}개에 언어 명시 없음 (\`\`\`python / \`\`\`cpp 등)`)
    }
  }

  // 4. 멀티라인 블록 수식: $$로 시작하면서 줄 끝이 $$로 닫히지 않고 TeX 명령 포함
  // (단일라인 $$E=mc^2$$ 는 OK)
  for (const line of body.split('\n')) {
    if (line.startsWith('$$')
        && !line.trimEnd().endsWith('$$')
        && /\\(begin|frac|int|sum|sqrt|mathbf|nabla|partial|left|right)/.test(line)) {
      errors.push(`블록 수식 첫 줄에 $$와 본문이 같은 줄: 파서 상태 오염 위험. 예: "${line.slice(0, 60)}..."`)
      break
    }
  }

  // 5. 도입부 클리셰 검사 (frontmatter 다음 첫 단락)
  const opening = body.replace(/^#.*$/gm, '').trim().split(/\n\n/)[0]?.replace(/[*_`]/g, '').trim()
  if (opening) {
    for (const cliche of CLICHES[locale] ?? []) {
      // ~ 부호는 패턴이라 단순 substring 매치
      const probe = cliche.replace(/^~|~$/g, '')
      if (probe && opening.toLowerCase().includes(probe.toLowerCase()) && opening.length < probe.length + 80) {
        errors.push(`도입부 첫 문장이 클리셰 포함: "${probe}" — 다른 표현으로 시작하세요`)
      }
    }
  }

  // 6. ## 섹션 헤딩
  if (!/^##\s/m.test(body)) {
    errors.push('## 섹션 헤딩 없음 (포스트가 너무 평면적)')
  }

  if (errors.length > 0) {
    allErrors.push({ file, errors })
    totalFailed++
  }
}

// ── 결과 ──────────────────────────────────────────────
if (totalFailed === 0) {
  console.log(`✅ 검증 통과 — ${files.length}개 파일`)
  process.exit(0)
}

console.error(`\n❌ ${totalFailed}/${files.length}개 파일 실패\n`)
for (const { file, errors } of allErrors) {
  console.error(`  ${file}`)
  for (const e of errors) console.error(`    - ${e}`)
}
console.error('\n수정 후 다시 commit하세요. (단, 자동 생성 게이트라 게이트 확인 필요시 --no-verify는 NOT 권장)')
process.exit(1)
