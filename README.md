# CFD.Lab

CFD 연구자가 운영하는 다국어 기술 블로그입니다. Next.js 16 App Router 기반이며, MDX 포스트와 인터랙티브 시각화 컴포넌트를 함께 렌더링합니다.

## Stack

- Next.js 16 + React 19
- Contentlayer2
- Tailwind CSS 4
- KaTeX + rehype-pretty-code
- Cloudflare Pages

## Locales

- `ko`
- `en`
- `ja`
- `zh`
- `es`

신규 자동 포스트는 5개 locale을 동시에 생성하는 것이 기본 규칙입니다.

## Directory Guide

```text
src/app/                  App Router pages
src/content/posts/        Locale별 MDX 포스트
src/components/post-viz/  포스트 전용 인터랙티브 시각화
src/components/viz/       공용 시각화 컴포넌트
src/i18n/                 UI 번역 사전
src/lib/                  인덱스, i18n, 메타 유틸
source-docs/              자동 포스트 생성용 소스 문서
scripts/                  인덱싱, 검증, RSS, 번역 스크립트
tests/                    Python 기반 생성 파이프라인 테스트
```

## Common Commands

```bash
npm run dev
npm run build
python -m pytest tests/ -v
node scripts/validate-post.mjs
```

## Automated Posting Workflow

요일별로 소스 문서 폴더와 프롬프트가 달라집니다.

- 월/수/금: `source-docs/cfd-technique/`
- 화/목: `source-docs/fluid-mechanics/`
- 토/일: `source-docs/paper-review/`

포스트 생성 시 다음이 필수입니다.

- 중복 날짜 체크
- 주제 중복 회피
- 인터랙티브 시각화 1~2개 포함
- 5개 locale 동시 작성
- `source-docs/index.yaml` 사용 이력 갱신

세부 규칙은 [AGENTS.md](./AGENTS.md)와 `scripts/prompts/`를 기준으로 합니다.

## Build Note

이 저장소는 WSL 경로에서 작업하는 경우가 많습니다. `node_modules`가 Linux 기준으로 설치된 상태에서 Windows Node로 빌드하면 `esbuild` 플랫폼 충돌이 발생할 수 있습니다. 빌드와 의존성 설치는 같은 플랫폼에서 맞춰 실행해야 합니다.

## References

- 디자인 시스템: [DESIGN.md](./DESIGN.md)
- 자동 개선 로그: [PROGRESS.md](./PROGRESS.md)
- 번역/스크립트 사용법: [scripts/README.md](./scripts/README.md)
