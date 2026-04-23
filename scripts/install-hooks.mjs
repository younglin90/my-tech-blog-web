#!/usr/bin/env node
/**
 * scripts/install-hooks.mjs
 *
 * 프로젝트 git hooks 설치. husky 의존성 없이 .git/hooks/pre-commit 파일을 직접 생성.
 *
 * 사용법:
 *   node scripts/install-hooks.mjs
 *
 * 한 번 실행하면 .git/hooks/pre-commit이 생성되어 이후 commit 시 자동 검증.
 * git --no-verify로 우회 가능 (긴급 시).
 */

import { existsSync, writeFileSync, chmodSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

const HOOK_DIR = join(process.cwd(), '.git', 'hooks')
const HOOK_PATH = join(HOOK_DIR, 'pre-commit')

if (!existsSync(join(process.cwd(), '.git'))) {
  console.error('❌ .git 디렉토리 없음. git 저장소가 아닙니다.')
  process.exit(1)
}

mkdirSync(HOOK_DIR, { recursive: true })

const HOOK_CONTENT = `#!/usr/bin/env bash
# Auto-installed by scripts/install-hooks.mjs
# 변경된 src/content/posts/**/*.mdx 파일 검증.
# 우회 필요 시: git commit --no-verify

set -e

# staged된 .mdx 파일만 검증
STAGED_MDX=$(git diff --cached --name-only --diff-filter=ACMR | grep -E '^src/content/posts/.*\\.mdx$' || true)

if [ -z "$STAGED_MDX" ]; then
  exit 0
fi

echo "🔍 Validating staged MDX posts..."
node scripts/validate-post.mjs $STAGED_MDX
`

writeFileSync(HOOK_PATH, HOOK_CONTENT)
chmodSync(HOOK_PATH, 0o755)
console.log(`✅ pre-commit hook 설치됨: ${HOOK_PATH}`)
console.log(`   src/content/posts/**/*.mdx 변경 시 자동 검증.`)
console.log(`   우회: git commit --no-verify`)
