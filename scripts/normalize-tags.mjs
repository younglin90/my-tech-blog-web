#!/usr/bin/env node
/**
 * scripts/normalize-tags.mjs — 태그 표기 정규화 (1회성 코드모드 + 재실행 안전)
 *
 * 두 가지를 고친다.
 *   1. 대소문자 충돌 17쌍 (Advection/advection …) → 빈도가 높은 표기로 통일.
 *      URL이 대소문자를 구분하므로 지금은 같은 주제가 두 개의 태그 페이지로 쪼개져 있다.
 *   2. 비ASCII 태그 34개 → .claude/rules/daily-post.md가 이미 규정한 영문 하이픈 표기.
 *      %EB%85%BC%EB%AC%B8… 형태의 퍼센트 인코딩 URL은 SERP에서 깨져 보이고, locale마다
 *      다른 태그 URL이 생겨 hreflang 클러스터가 갈라진다. 공백이 든 태그 2개(%20)도 여기서 사라진다.
 *
 * frontmatter의 `tags:` 한 줄만 건드린다. 본문·수식·코드는 손대지 않는다.
 * 5개 locale 파일에 동일하게 적용된다 (태그는 locale 공통이 원칙).
 *
 *   node scripts/normalize-tags.mjs --dry     # 변경 미리보기
 *   node scripts/normalize-tags.mjs           # 적용
 *   node scripts/normalize-tags.mjs --emit-redirects public/_redirects
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = 'src/content/posts'
const LOCALES = ['ko', 'en', 'ja', 'zh', 'es']
const DRY = process.argv.includes('--dry')
const emitIdx = process.argv.indexOf('--emit-redirects')
const REDIRECT_OUT = emitIdx >= 0 ? process.argv[emitIdx + 1] : null

// 대소문자 충돌 → 빈도 높은 쪽으로. 키는 소문자, 값은 정본 표기.
const CASE_CANON = {
  advection: 'Advection',
  'asymptotic-preserving': 'Asymptotic-Preserving',
  characteristics: 'Characteristics',
  'compressible-multiphase': 'Compressible-Multiphase',
  diffusion: 'Diffusion',
  'flux-limiter': 'Flux-Limiter',
  'fractional-step': 'Fractional-Step',
  godunov: 'Godunov',
  implicit: 'Implicit',
  'interface-capturing': 'Interface-Capturing',
  'iterative-solver': 'Iterative-Solver',
  'kapila-model': 'Kapila-Model',
  'low-mach': 'Low-Mach',
  'natural-convection': 'Natural-Convection',
  'riemann-solver': 'Riemann-Solver',
  'shock-capturing': 'Shock-Capturing',
  'unstructured-grid': 'Unstructured-Grid',
}

// 비ASCII → 영문 하이픈. 저마하/점근보존은 기존 영문 태그로 흡수된다.
const RENAME = {
  논문리뷰: 'Paper-Review',
  유동현상: 'Flow-Phenomena',
  유체역학: 'Fluid-Dynamics',
  수치해석: 'Numerical-Analysis',
  알고리즘: 'Algorithms',
  메시: 'Mesh',
  해석해: 'Analytical-Solution',
  고전유동: 'Classical-Flows',
  CFD검증: 'CFD-Verification',
  무차원화: 'Nondimensionalization',
  시각화: 'Visualization',
  유동천이: 'Flow-Transition',
  쿼드트리: 'Quadtree',
  딥러닝: 'Deep-Learning',
  난류모델: 'Turbulence-Model',
  Dean유동: 'Dean-Flow',
  이차유동: 'Secondary-Flow',
  나선형관: 'Helical-Pipe',
  포아즈이유: 'Poiseuille',
  유한차분: 'Finite-Difference',
  양력: 'Lift',
  튜토리얼: 'Tutorial',
  후방계단: 'Backward-Facing-Step',
  난류: 'Turbulence',
  저마하: 'Low-Mach',
  점근보존: 'Asymptotic-Preserving',
  CFD실무: 'CFD-Practice',
  수렴: 'Convergence',
  Weber수: 'Weber-Number',
  액주분열: 'Jet-Breakup',
  '고차 정확도': 'High-Order',
  '압축성 유동': 'Compressible-Flow',
  강체역학: 'Rigid-Body-Dynamics',
  쿼터니언: 'Quaternion',
}

export function canonicalTag(tag) {
  if (RENAME[tag]) return RENAME[tag]
  const c = CASE_CANON[tag.toLowerCase()]
  return c ?? tag
}

const parseTags = (line) =>
  line
    .replace(/^tags:\s*\[/, '')
    .replace(/\]\s*$/, '')
    .split(',')
    .map((s) => s.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)

let filesChanged = 0
const retired = new Map() // 사라진 표기 → 정본

for (const loc of LOCALES) {
  const dir = join(ROOT, loc)
  for (const name of readdirSync(dir).filter((n) => n.endsWith('.mdx'))) {
    const path = join(dir, name)
    const raw = readFileSync(path, 'utf-8')
    const m = raw.match(/^tags:\s*\[.*\]\s*$/m)
    if (!m) continue

    const before = parseTags(m[0])
    const after = []
    for (const tg of before) {
      const canon = canonicalTag(tg)
      if (canon !== tg) retired.set(tg, canon)
      if (!after.includes(canon)) after.push(canon)
    }
    if (before.length === after.length && before.every((t, i) => t === after[i])) continue

    const next = raw.replace(m[0], `tags: [${after.map((t) => `"${t}"`).join(', ')}]`)
    if (DRY) {
      console.log(`  ${loc}/${name}\n    - [${before.join(', ')}]\n    + [${after.join(', ')}]`)
    } else {
      writeFileSync(path, next.replace(/\r\n/g, '\n'), 'utf-8')
    }
    filesChanged++
  }
}

console.log(`${DRY ? '[dry] ' : ''}tags normalized in ${filesChanged} files; ${retired.size} spellings retired`)

if (REDIRECT_OUT) {
  // 이미 색인된 옛 태그 URL이 404가 되지 않도록 301을 깐다.
  // Cloudflare Pages _redirects: `from  to  code`, 위에서부터 첫 일치가 적용된다.
  const lines = [
    '# 자동 생성: node scripts/normalize-tags.mjs --emit-redirects public/_redirects',
    '# 태그 표기 통일로 은퇴한 URL → 정본 태그. 직접 수정하지 말 것.',
    '',
  ]
  for (const [from, to] of [...retired.entries()].sort()) {
    for (const loc of LOCALES) {
      lines.push(`/${loc}/tags/${encodeURIComponent(from)}  /${loc}/tags/${encodeURIComponent(to)}  301`)
    }
  }
  lines.push('')
  writeFileSync(REDIRECT_OUT, lines.join('\n'), 'utf-8')
  console.log(`wrote ${REDIRECT_OUT} (${retired.size * LOCALES.length} redirects)`)
}
