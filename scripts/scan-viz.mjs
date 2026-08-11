#!/usr/bin/env node
/**
 * scripts/scan-viz.mjs — viz 사용 매니페스트 생성.
 *
 * src/content/posts/ko/*.mdx 본문에서 <ComponentName .../> 패턴과
 * import { X } from '@/components/post-viz/...' 구문을 추출해
 * src/lib/viz-manifest.json 으로 저장한다.
 *
 * 빌드 prebuild에서 실행. 갤러리 페이지에서 manifest를 import해 노출.
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'

const POSTS_DIR = 'src/content/posts/ko'
const POST_VIZ_DIR = 'src/components/post-viz'
const OUT = 'src/lib/viz-manifest.json'
const REGISTRY_OUT = 'src/lib/viz-registry.tsx'

const PRE_BUILT = ['VelocityField', 'StreamLine', 'NumericalScheme', 'PressureContour', 'BoundaryCondition', 'NumericalDungeon', 'MachArchitect']
const PRE_BUILT_IMPORTS = {
  VelocityField: '@/components/viz/VelocityField',
  StreamLine: '@/components/viz/StreamLine',
  NumericalScheme: '@/components/viz/NumericalScheme',
  PressureContour: '@/components/viz/PressureContour',
  BoundaryCondition: '@/components/viz/BoundaryCondition',
  NumericalDungeon: '@/components/NumericalDungeon',
  MachArchitect: '@/components/MachArchitect',
}

function listMdx(dir) {
  return readdirSync(dir).filter((n) => n.endsWith('.mdx')).map((n) => join(dir, n))
}

function listPostVizFolders() {
  try {
    return readdirSync(POST_VIZ_DIR, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
      .map((d) => d.name)
  } catch { return [] }
}

const items = []  // { component, type: 'pre-built'|'custom', postSlug, postTitle, postUrl, file? }

for (const file of listMdx(POSTS_DIR)) {
  const content = readFileSync(file, 'utf-8')
  const slug = basename(file, '.mdx')
  const titleMatch = content.match(/^title:\s*"([^"]+)"/m)
  const title = titleMatch ? titleMatch[1] : slug
  const draftMatch = content.match(/^draft:\s*(true|false)/m)
  if (draftMatch && draftMatch[1] === 'true') continue

  // pre-built JSX: <Foo ...
  for (const name of PRE_BUILT) {
    const re = new RegExp(`<${name}[\\s/>]`)
    if (re.test(content)) {
      items.push({
        component: name,
        type: 'pre-built',
        postSlug: slug,
        postTitle: title,
        postUrl: `/posts/${slug}`,
      })
    }
  }

  // custom: import { X } from '@/components/post-viz/{folder}/X'
  const importRe = /import\s*\{\s*([^}]+?)\s*\}\s*from\s*['"]@\/components\/post-viz\/([^/'"]+)\/([^'"]+)['"]/g
  let m
  while ((m = importRe.exec(content)) !== null) {
    const [, names, folder, fileName] = m
    for (const n of names.split(',').map((s) => s.trim())) {
      items.push({
        component: n,
        type: 'custom',
        postSlug: slug,
        postTitle: title,
        postUrl: `/posts/${slug}`,
        folder,
        file: `src/components/post-viz/${folder}/${fileName}.tsx`,
      })
    }
  }
}

// 폴더 존재하지만 import 안된 것도 추가 (orphan)
const importedFolders = new Set(items.filter((i) => i.type === 'custom').map((i) => i.file?.match(/post-viz\/([^/]+)/)?.[1]).filter(Boolean))
for (const folder of listPostVizFolders()) {
  if (importedFolders.has(folder)) continue
  // 안에 .tsx 있으면 등록 (포스트 미연결)
  try {
    const files = readdirSync(join(POST_VIZ_DIR, folder)).filter((n) => n.endsWith('.tsx'))
    for (const f of files) {
      items.push({
        component: f.replace(/\.tsx$/, ''),
        type: 'custom-orphan',
        postSlug: '',
        postTitle: folder,
        postUrl: '',
        file: `src/components/post-viz/${folder}/${f}`,
      })
    }
  } catch {}
}

writeFileSync(OUT, JSON.stringify(items, null, 2))
console.log(`✅ viz manifest 생성: ${items.length}개 항목 → ${OUT}`)

function listCustomComponents() {
  const components = []
  for (const folder of listPostVizFolders()) {
    let files = []
    try {
      files = readdirSync(join(POST_VIZ_DIR, folder)).filter((n) => n.endsWith('.tsx'))
    } catch {
      continue
    }

    for (const fileName of files) {
      const filePath = join(POST_VIZ_DIR, folder, fileName)
      const raw = readFileSync(filePath, 'utf-8')
      const exportMatch = raw.match(/export\s+function\s+([A-Za-z][A-Za-z0-9_]*)\s*\(/)
        ?? raw.match(/export\s+const\s+([A-Za-z][A-Za-z0-9_]*)\s*=/)
      const component = exportMatch?.[1] ?? fileName.replace(/\.tsx$/, '')
      components.push({
        component,
        importPath: `@/components/post-viz/${folder}/${fileName.replace(/\.tsx$/, '')}`,
      })
    }
  }
  return components
}

const registryEntries = [
  ...PRE_BUILT.map((component) => ({
    component,
    importPath: PRE_BUILT_IMPORTS[component],
  })),
  ...listCustomComponents(),
]

const seen = new Set()
const registry = registryEntries
  .filter((entry) => {
    if (seen.has(entry.component)) return false
    seen.add(entry.component)
    return true
  })
  .sort((a, b) => a.component.localeCompare(b.component))

const registrySource = `'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'
import { VizMount } from '@/components/VizMount'

function VizLoading() {
  return (
    <div className="rounded-lg p-4 text-xs" style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
      Loading visualization...
    </div>
  )
}

// 각 viz는 뷰포트 300px 앞에 올 때까지 마운트하지 않는다. post-viz는 전부
// 조건 없는 requestAnimationFrame 루프를 돌기 때문에, 그냥 두면 페이지 로드 즉시
// 캔버스 루프가 hydration·첫 입력과 메인 스레드를 놓고 경쟁한다. (src/components/VizMount.tsx)
function lazyViz(load: () => Promise<{ default: ComponentType }>): ComponentType {
  const Inner = dynamic(load, { ssr: false, loading: VizLoading })
  const Wrapped = () => <VizMount Component={Inner} />
  return Wrapped
}

export const VIZ_COMPONENTS: Record<string, ComponentType> = {
${registry.map(({ component, importPath }) => `  ${JSON.stringify(component)}: lazyViz(() => import(${JSON.stringify(importPath)}).then((m) => ({ default: m.${component} }))),`).join('\n')}
}
`

writeFileSync(REGISTRY_OUT, registrySource)
console.log(`✅ viz registry 생성: ${registry.length}개 컴포넌트 → ${REGISTRY_OUT}`)
