import { readdirSync, statSync, rmSync } from 'node:fs'
import { join } from 'node:path'

// Cloudflare Pages는 배포당 파일 20,000개 한도가 있다.
// Next.js 16 App Router는 라우트마다 클라이언트 <Link> prefetch용
// RSC segment chunk(`__next.*.txt`)를 7~8개씩 생성하는데, 정적 사이트에서는
// 이 파일이 없어도 페이지가 정상 로드된다(prefetch만 fallback). 이들을 지워
// 배포 파일 수를 한도 아래로 유지한다.

const OUT_DIR = join(process.cwd(), 'out')
const PATTERN = /^__next\..*\.txt$/

let removed = 0

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full)
    } else if (PATTERN.test(entry.name)) {
      rmSync(full)
      removed++
    }
  }
}

try {
  statSync(OUT_DIR)
} catch {
  console.error('❌ out/ 디렉토리가 없음 — next build를 먼저 실행하세요.')
  process.exit(1)
}

walk(OUT_DIR)

// 남은 전체 파일 수 집계 (한도 모니터링)
let total = 0
function count(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) count(join(dir, entry.name))
    else total++
  }
}
count(OUT_DIR)

const LIMIT = 20000
console.log(`✅ RSC prefetch chunk 정리: ${removed}개 삭제`)
console.log(`   out/ 전체 파일 수: ${total} / ${LIMIT} (Cloudflare Pages 한도)`)
if (total > LIMIT) {
  console.error(`❌ 여전히 한도 초과 (${total - LIMIT}개). 추가 정리 필요.`)
  process.exit(1)
}
