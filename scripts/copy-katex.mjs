#!/usr/bin/env node
// KaTeX CSS + 폰트를 public/katex/로 복사. 빌드 전에 1회 실행.
// 결과: public/katex/katex.min.css + public/katex/fonts/*
// CDN preload 대신 self-host로 제공되어 LCP / CLS 개선.

import { mkdirSync, readdirSync, copyFileSync, statSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const SRC = join(REPO_ROOT, 'node_modules', 'katex', 'dist')
const DEST = join(REPO_ROOT, 'public', 'katex')

if (!existsSync(SRC)) {
  console.error('❌ katex 모듈을 찾을 수 없음:', SRC)
  process.exit(1)
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry)
    const destPath = join(dest, entry)
    const s = statSync(srcPath)
    if (s.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

mkdirSync(DEST, { recursive: true })

// CSS 1개 + fonts 디렉토리만 복사 (contrib/ 등은 사용 안 함)
copyFileSync(join(SRC, 'katex.min.css'), join(DEST, 'katex.min.css'))
copyDir(join(SRC, 'fonts'), join(DEST, 'fonts'))

const fontCount = readdirSync(join(DEST, 'fonts')).length
console.log(`✅ KaTeX 자산 복사: public/katex/katex.min.css + ${fontCount} 폰트`)
