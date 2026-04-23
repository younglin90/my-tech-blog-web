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

import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const POSTS_DIR = 'src/content/posts/ko'
const POST_VIZ_DIR = 'src/components/post-viz'
const OUT = 'src/lib/viz-manifest.json'

const PRE_BUILT = ['VelocityField', 'StreamLine', 'NumericalScheme', 'PressureContour', 'BoundaryCondition', 'NumericalDungeon', 'MachArchitect']

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
  const slug = file.split('/').pop().replace(/\.mdx$/, '')
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
