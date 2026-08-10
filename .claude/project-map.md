# 프로젝트 맵 (필요할 때만 읽기 — 자동 주입 아님)

CLAUDE.md에서 분리해 둔 참고 자료. 사이트 코드를 건드릴 때만 읽는다.
매일 포스트 루틴에는 필요 없다 (`.claude/rules/daily-post.md`가 경로를 다 갖고 있다).

## Stack
Next.js 16 (App Router) · Contentlayer2 · React 19 · Tailwind CSS 4 · KaTeX(rehype-katex) ·
rehype-pretty-code. 배포: Cloudflare Pages(`main` push → build).
폰트 Fraunces(display) / Geist(body) / JetBrains Mono(code), 다크 기본.

## 경로
| Path | 역할 |
|------|------|
| `src/app/[locale]/` | 로컬라이즈드 라우트 (ko/en/ja/zh/es) |
| `src/app/{admin,preview,read}/` | 관리자 전용, noindex |
| `src/content/posts/{ko,en,ja,zh,es}/` | MDX 포스트 — locale별 폴더, slug 공유 |
| `src/components/MDX.tsx` | MDX 렌더러 + 컴포넌트 레지스트리 |
| `src/components/viz/` | pre-built viz 5종 |
| `src/components/{NumericalDungeon,MachArchitect}.tsx` | 단독 viz |
| `src/components/post-viz/{slug}/` | 포스트 전용 viz (매 포스트 신규 작성) |
| `src/components/{admin,calculators}/` | 관리자 패널 + 계산기 |
| `src/i18n/{locale}.json` | UI 문자열 사전 |
| `src/lib/` | dynamic-posts.ts, viz-registry.tsx, 생성 인덱스 json |
| `source-docs/{cfd-technique,fluid-mechanics,paper-review}/` | 포스트 소스 |
| `source-docs/index.yaml` | `last_used` 로테이션 원장 (자동 갱신, 수정 금지) |
| `scripts/` | 빌드·자동화 (`scripts/README.md`) |
| `functions/_middleware.ts` | Cloudflare locale redirect |
| `contentlayer.config.ts` | MDX 스키마 |

## 명령어
| 명령 | 동작 |
|------|------|
| `node scripts/daily-context.mjs` | 매일 루틴 컨텍스트 1회 출력 (날짜·그룹·소스 선택·최근 10개) |
| `node scripts/verify-post-set.mjs <slug> [--run]` | 5 locale 포스트 정합 검증 |
| `npm run dev` | copy-katex → scan-viz → build-post-index → next dev |
| `npm run build` | 전체 파이프라인 + next build + rss + verify-static-routes |
| `npm run validate-post` | MDX 검증 |
| `npm run lighthouse` | Lighthouse 감사 |
| `python -m pytest tests/ -v` | 테스트 |

기타 스크립트: audit-posts, check-links, readiness-score, scan-{viz,math,glossary},
tools-visual-score, verify-static-routes, install-hooks, translate-existing-posts.

## 기타
- 관리자 비번: SHA-256 해시를 `.env.local`(`NEXT_PUBLIC_ADMIN_PASSWORD_HASH`) + Cloudflare env에 동일하게.
- `scripts/generate_post.py`, `scripts/prompts/*.txt` — 폐기된 API 파이프라인 잔재. 읽지 말 것.
- 변경 이력: `.claude/history.md`
