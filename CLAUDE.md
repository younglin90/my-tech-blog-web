# CFD.Lab — Project Guide for Claude

## Project Overview
CFD 엔지니어를 위한 기술 블로그. AI가 매일 소스 문서(PDF/HWP/docx)를 읽고 MDX 포스트를 자동 생성 후 PR로 제출. 사람이 검토 후 머지하면 Cloudflare Pages에 자동 배포.

## Design System
**반드시 DESIGN.md를 읽고 모든 UI/비주얼 결정을 내리세요.**
- 폰트: Display=Fraunces, Body=Geist, Code=JetBrains Mono
- 배경: dark `#08111f`, light `#fafaf9`
- Accent: dark `#22d3ee`, light `#0e7490` (viridis colormap cold end)
- CSS 변수 시스템: `--bg`, `--surface`, `--border`, `--accent`, `--text`, `--text-muted`
- DESIGN.md와 일치하지 않는 코드를 발견하면 지적하세요.
- 사용자의 명시적 승인 없이 디자인 시스템을 변경하지 마세요.

## Architecture
- **Framework:** Next.js 16 (App Router) + Contentlayer2
- **Content:** `src/content/posts/*.mdx` (frontmatter: title, date, description, draft, tags)
- **Deployment:** Cloudflare Pages (main 브랜치 push → 자동 빌드)
- **Auto-generation:** `.github/workflows/daily-post.yml` → `scripts/generate_post.py`

## Content Pipeline
- 소스 문서: `source-docs/` (notes, qa-log) + `source-papers/` (private repo, 화요일 논문)
- 요일별 포맷: `scripts/prompts/{weekday}_*.txt`
- 문서 인덱스: `source-docs/index.yaml` (last_used 기반 순환)
- 생성된 포스트: `draft: true` → PR 생성 → 사람 검토 → `draft: false` → 머지

## Visualization Components (수요일 포스트)
MDX에서 사용 가능한 컴포넌트 (`src/components/viz/` + 기존):
- `<VelocityField reynolds={100} animated gridSize={20} />`
- `<StreamLine particles={50} speed={1.0} obstacle="cylinder" />`
- `<NumericalScheme scheme="upwind" order={1} />`
- `<PressureContour levels={10} colormap="viridis" />`
- `<BoundaryCondition type="inlet" interactive />`
- `<NumericalDungeon />` (고정 props)
- `<MachArchitect />` (고정 props)

**이 목록 외 컴포넌트는 AI 자동 생성 금지.**

## Key Files
| File | Purpose |
|------|---------|
| `DESIGN.md` | 디자인 시스템 소스 오브 트루스 |
| `scripts/generate_post.py` | 포스트 자동 생성 스크립트 |
| `scripts/requirements.txt` | Python 의존성 (버전 고정) |
| `source-docs/index.yaml` | 소스 문서 메타데이터 |
| `contentlayer.config.ts` | MDX 스키마 정의 |
| `tests/test_generate.py` | pytest 테스트 (CI에서 실행) |

## Commands
```bash
npm run dev        # 개발 서버
npm run build      # 프로덕션 빌드
python -m pytest tests/ -v  # 포스트 생성 테스트
python scripts/generate_post.py monday  # 수동 포스트 생성 테스트
```

## GitHub Secrets 필요
- `ANTHROPIC_API_KEY` — Claude API 키
- `PAPERS_DEPLOY_KEY` — cfd-source-papers private repo deploy key (화요일 논문용)
