#!/usr/bin/env node
// source-docs/glossary.yaml + published ko posts -> src/lib/glossary.json.
// The glossary page is a post-derived CFD dictionary, not a detached static list.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const SRC = 'source-docs/glossary.yaml'
const I18N = 'source-docs/glossary-i18n.json'
const POSTS_DIR = 'src/content/posts/ko'
const OUT = 'src/lib/glossary.json'
const LOCALES = ['ja', 'zh', 'es']

const AUTO_TERMS = {
  'Navier-Stokes': {
    ko: '질량·운동량 보존으로 유체 운동을 기술하는 지배방정식.',
    en: 'Governing equations for fluid motion from mass and momentum conservation.',
    aliases: ['Navier–Stokes', 'Navier Stokes', 'N-S'],
  },
  'Finite Volume': {
    ko: '셀 체적에 보존법칙을 적분해 면 플럭스로 이산화하는 CFD 방법.',
    en: 'CFD method that integrates conservation laws over cells and discretizes face fluxes.',
    aliases: ['FVM', 'finite-volume', '유한체적'],
  },
  'Finite Difference': {
    ko: '격자점 값의 차분으로 미분 연산자를 근사하는 수치 방법.',
    en: 'Numerical method that approximates derivatives with differences between grid values.',
    aliases: ['FDM', 'finite-difference', '유한차분'],
  },
  'Finite Element': {
    ko: '요소별 기저함수와 약형식을 사용해 PDE를 이산화하는 방법.',
    en: 'PDE discretization using element-wise basis functions and weak forms.',
    aliases: ['FEM', 'finite-element', '유한요소'],
  },
  DG: {
    ko: 'Discontinuous Galerkin. 요소 사이 불연속을 허용하는 고차 Galerkin 계열 방법.',
    en: 'Discontinuous Galerkin method; a high-order Galerkin family allowing inter-element jumps.',
    aliases: ['Discontinuous Galerkin'],
  },
  'Flux Limiter': {
    ko: '급격한 구배에서 진동을 억제하도록 고차 보정량을 제한하는 비선형 함수.',
    en: 'Nonlinear function that limits high-order corrections to suppress oscillations near steep gradients.',
    aliases: ['flux limiter', 'limiter'],
  },
  TENO: {
    ko: 'Targeted ENO. 후보 스텐실을 0/1 방식으로 선별하는 저소산 충격파 포착 재구성.',
    en: 'Targeted ENO reconstruction that selects candidate stencils with a sharp 0/1 decision.',
  },
  'Lax-Wendroff': {
    ko: '시간 Taylor 전개를 이용하는 2차 정확도 선형 이류 스킴.',
    en: 'Second-order linear advection scheme based on a time Taylor expansion.',
    aliases: ['Lax–Wendroff'],
  },
  'Rhie-Chow': {
    ko: 'Collocated 격자에서 압력 체커보드 진동을 막는 운동량 가중 보간.',
    en: 'Momentum-weighted interpolation that suppresses checkerboard pressure modes on collocated grids.',
    aliases: ['Rhie & Chow', 'MWI'],
  },
  'Checkerboard Pressure': {
    ko: '압력과 속도 결합이 약할 때 격자에 번갈아 나타나는 비물리적 압력 모드.',
    en: 'Nonphysical alternating pressure mode caused by weak pressure-velocity coupling.',
    aliases: ['checkerboard', '체커보드 압력'],
  },
  'Collocated Grid': {
    ko: '압력과 속도 등 변수를 같은 셀 중심에 저장하는 격자 배치.',
    en: 'Grid arrangement storing pressure, velocity, and other variables at the same cell center.',
    aliases: ['collocated'],
  },
  'Staggered Grid': {
    ko: '압력과 속도 성분을 서로 다른 위치에 저장해 압력-속도 결합을 강화하는 격자.',
    en: 'Grid arrangement that stores pressure and velocity components at different locations.',
    aliases: ['staggered'],
  },
  'Riemann Solver': {
    ko: '셀 경계의 좌우 상태로 국소 리만 문제를 풀어 수치 플럭스를 구하는 알고리즘.',
    en: 'Algorithm that solves a local Riemann problem at a cell face to compute numerical flux.',
    aliases: ['Riemann solver', '리만 솔버'],
  },
  'Five-Equation Model': {
    ko: '압축성 다상유동에서 상 부피분율과 혼합 운동량·에너지를 추적하는 5개 방정식 모델.',
    en: 'Compressible multiphase model tracking volume fraction plus mixture momentum and energy.',
    aliases: ['five-equation', '5-equation'],
  },
  'Speed of Sound': {
    ko: '압력 교란이 매질을 통해 전파되는 속도. 압축성 혼합물에서는 상분율에 민감하다.',
    en: 'Propagation speed of pressure disturbances; sensitive to phase fraction in compressible mixtures.',
    aliases: ['음속'],
  },
  'Level Set': {
    ko: '계면을 부호 거리 함수의 영등위면으로 표현하는 계면 포착 방법.',
    en: 'Interface-capturing method representing the interface as the zero contour of a signed-distance function.',
  },
  'Diffuse Interface': {
    ko: '계면을 불연속 면이 아니라 유한 두께의 완만한 전이층으로 표현하는 모델.',
    en: 'Model that represents an interface as a finite-thickness transition layer instead of a sharp discontinuity.',
    aliases: ['확산 계면'],
  },
  'Volume Fraction': {
    ko: '다상유동 셀에서 특정 상이 차지하는 체적 비율.',
    en: 'Fraction of a cell volume occupied by a particular phase in multiphase flow.',
    aliases: ['void fraction', '부피분율', '체적분율'],
  },
  'Boundary Layer': {
    ko: '벽면 점성 영향으로 속도 구배가 집중되는 얇은 유동 영역.',
    en: 'Thin near-wall region where viscous effects concentrate velocity gradients.',
    aliases: ['경계층'],
  },
  'Wall Distance': {
    ko: '셀 또는 점에서 가장 가까운 벽까지의 거리. 벽함수와 난류 모델에 필요하다.',
    en: 'Distance from a cell or point to the nearest wall, needed by wall functions and turbulence models.',
    aliases: ['wall-distance', '벽거리'],
  },
  'Fast Marching': {
    ko: 'Eikonal 방정식의 도착 시간을 단조적으로 전파해 거리장을 계산하는 알고리즘.',
    en: 'Algorithm that computes distance or arrival-time fields by monotone propagation of the Eikonal equation.',
    aliases: ['fast marching'],
  },
  Eikonal: {
    ko: '거리 함수나 파면 도착 시간을 나타내는 일차 비선형 PDE.',
    en: 'First-order nonlinear PDE describing distance functions or wavefront arrival time.',
  },
  Krylov: {
    ko: '행렬-벡터 곱으로 생성되는 부분공간. 대형 선형 시스템 반복해법의 기반.',
    en: 'Subspace generated by matrix-vector products; basis of iterative solvers for large linear systems.',
  },
  GMRES: {
    ko: '비대칭 선형 시스템에서 잔차를 최소화하는 Krylov 부분공간 반복해법.',
    en: 'Krylov iterative method that minimizes residuals for nonsymmetric linear systems.',
  },
  BiCGSTAB: {
    ko: '비대칭 선형 시스템에 쓰이는 안정화된 쌍켤레기울기 반복해법.',
    en: 'Stabilized bi-conjugate-gradient iterative solver for nonsymmetric linear systems.',
  },
  'Rankine Vortex': {
    ko: '안쪽은 강제와류, 바깥은 자유와류로 구성된 단순한 와류 모델.',
    en: 'Simple vortex model with a forced-vortex core and free-vortex exterior.',
    aliases: ['Rankine vortex'],
  },
  Vorticity: {
    ko: '속도장의 curl. 유체 입자 회전률의 두 배로 해석된다.',
    en: 'Curl of the velocity field; twice the local spin rate of a fluid particle.',
    aliases: ['와도'],
  },
  Helmholtz: {
    ko: '비점성 바로트로픽 유동에서 와선의 보존 성질을 설명하는 고전 와류 정리.',
    en: 'Classical vortex theorem describing vortex-line conservation in inviscid barotropic flow.',
  },
  'Dean Vortex': {
    ko: '곡관의 원심력으로 생기는 단면 내 한 쌍의 이차 유동 와류.',
    en: 'Pair of secondary-flow vortices generated by centrifugal effects in curved pipes.',
    aliases: ['Dean vortices', 'Dean 와류'],
  },
  Poiseuille: {
    ko: '압력 구배가 구동하는 점성 지배 내부 유동의 해석해.',
    en: 'Analytical viscous internal flow driven by a pressure gradient.',
  },
  'Plateau-Rayleigh': {
    ko: '표면장력으로 액주가 액적으로 끊어지는 불안정성.',
    en: 'Surface-tension instability that breaks a liquid jet into droplets.',
    aliases: ['Plateau–Rayleigh'],
  },
  'Shallow Water': {
    ko: '수평 길이가 수심보다 훨씬 클 때 자유수면 유동을 깊이 평균한 방정식 계열.',
    en: 'Depth-averaged free-surface flow equations for horizontal scales much larger than depth.',
    aliases: ['shallow-water', '천수방정식'],
  },
  'Semi-Implicit': {
    ko: '강한 안정성 제약을 만드는 항은 암시적으로, 나머지는 명시적으로 처리하는 시간 적분.',
    en: 'Time integration that treats stiff terms implicitly and other terms explicitly.',
    aliases: ['semi-implicit'],
  },
  Quaternion: {
    ko: '3D 회전을 특이점 없이 표현하는 4성분 수 체계.',
    en: 'Four-component number system for singularity-free 3D rotations.',
  },
  PINN: {
    ko: 'Physics-Informed Neural Network. PDE 잔차를 손실 함수에 넣는 신경망 방법.',
    en: 'Physics-Informed Neural Network that embeds PDE residuals into the loss function.',
  },
  'k-epsilon': {
    ko: '난류 운동에너지 k와 소산률 epsilon을 푸는 2방정식 RANS 모델.',
    en: 'Two-equation RANS model solving turbulence kinetic energy k and dissipation epsilon.',
    aliases: ['k-ε', 'k epsilon'],
  },
  SST: {
    ko: '벽 근처 k-omega와 외부 k-epsilon 특성을 섞은 난류 모델.',
    en: 'Turbulence model blending near-wall k-omega behavior with outer-flow k-epsilon behavior.',
  },
  'y+': {
    ko: '벽면 첫 셀 거리의 무차원 값. 벽함수와 wall-resolved 해석의 핵심 지표.',
    en: 'Nondimensional wall distance of the first cell; key metric for wall functions and wall-resolved CFD.',
    aliases: ['y-plus', 'y plus'],
  },
}

function parseGlossaryYaml(raw) {
  const result = {}
  let currentKey = null
  let currentEntry = null
  let inTerms = false

  for (const line of raw.split('\n')) {
    if (/^\s*#/.test(line) || !line.trim()) continue
    if (line.startsWith('terms:')) {
      inTerms = true
      continue
    }
    if (!inTerms) continue

    const termStart = line.match(/^  ([^:]+):\s*$/)
    if (termStart) {
      currentKey = termStart[1].trim()
      currentEntry = { ko: '', en: '', wiki: '', aliases: [], source: 'manual' }
      result[currentKey] = currentEntry
      continue
    }

    const field = line.match(/^    (ko|en|ja|zh|es|wiki):\s*"?(.*?)"?\s*$/)
    if (field && currentEntry) {
      const [, key, val] = field
      currentEntry[key] = val
    }
  }

  return result
}

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  const fm = m[1]
  const title = fm.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? ''
  const description = fm.match(/^description:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim() ?? ''
  const date = fm.match(/^date:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*$/m)?.[1] ?? ''
  const draft = (fm.match(/^draft:\s*(true|false)\s*$/m)?.[1] ?? 'false') === 'true'
  const tagRaw = fm.match(/^tags:\s*\[([^\]]*)\]\s*$/m)?.[1] ?? ''
  const tags = tagRaw.split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean)
  return { title, description, date, draft, tags, body: content.slice(m[0].length) }
}

function stripMdx(body) {
  return body
    .replace(/^import\s+.*$/gm, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/\$\$[\s\S]*?\$\$/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]+\)/g, '$1')
}

function loadPosts() {
  const posts = []
  for (const file of readdirSync(POSTS_DIR).filter((n) => n.endsWith('.mdx'))) {
    const raw = readFileSync(join(POSTS_DIR, file), 'utf-8')
    const parsed = parseFrontmatter(raw)
    if (!parsed || parsed.draft) continue
    const slug = file.replace(/\.mdx$/, '')
    const text = [parsed.title, parsed.description, parsed.tags.join(' '), stripMdx(parsed.body)].join('\n')
    posts.push({ slug, title: parsed.title, date: parsed.date, tags: parsed.tags, text })
  }
  return posts
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function countNeedle(text, needle) {
  if (!needle) return 0
  const escaped = escapeRegex(needle).replace(/\\\s+/g, '\\s+')
  const needsBoundary = /^[A-Za-z0-9_ -]+$/.test(needle)
  const source = needsBoundary ? `(?<![A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])` : escaped
  const matches = text.match(new RegExp(source, 'gi'))
  return matches?.length ?? 0
}

function mergeAutoTerms(result) {
  for (const [term, entry] of Object.entries(AUTO_TERMS)) {
    if (!result[term]) {
      result[term] = { ko: entry.ko, en: entry.en, wiki: entry.wiki ?? '', aliases: [], source: 'post-curated' }
    } else {
      result[term].ko ||= entry.ko
      result[term].en ||= entry.en
      result[term].wiki ||= entry.wiki ?? ''
    }
    result[term].aliases = Array.from(new Set([...(result[term].aliases ?? []), ...(entry.aliases ?? [])]))
  }
}

const result = parseGlossaryYaml(readFileSync(SRC, 'utf-8'))
mergeAutoTerms(result)

const localeOverlay = JSON.parse(readFileSync(I18N, 'utf-8'))
for (const [term, texts] of Object.entries(localeOverlay)) {
  if (!result[term]) {
    console.error(`glossary-i18n: unknown term ${term}`)
    process.exitCode = 1
    continue
  }
  for (const loc of LOCALES) {
    if (texts[loc] && !result[term][loc]) result[term][loc] = texts[loc]
  }
}
for (const term of Object.keys(result)) {
  for (const loc of LOCALES) {
    if (!result[term][loc]) console.error(`glossary-i18n: missing ${loc} for ${term}`)
  }
}

const posts = loadPosts()
for (const [term, entry] of Object.entries(result)) {
  const needles = Array.from(new Set([term, ...(entry.aliases ?? [])]))
  const refs = []
  let total = 0

  for (const post of posts) {
    const count = needles.reduce((sum, needle) => sum + countNeedle(post.text, needle), 0)
    if (count > 0) {
      total += count
      refs.push({ slug: post.slug, title: post.title, date: post.date, count })
    }
  }

  refs.sort((a, b) => b.count - a.count || (a.date < b.date ? 1 : -1))
  entry.count = total
  entry.posts = refs.slice(0, 8)
  if (!entry.source) entry.source = 'manual'
}

const sorted = Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)))
writeFileSync(OUT, JSON.stringify(sorted, null, 2))
const withRefs = Object.values(sorted).filter((entry) => entry.posts?.length).length
console.log(`✅ glossary: ${Object.keys(sorted).length} terms, ${withRefs} with post refs → ${OUT}`)
