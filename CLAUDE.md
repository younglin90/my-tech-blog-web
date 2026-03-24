# CFD.Lab — Claude Code 프로젝트 가이드

## 이 프로젝트가 무엇인가
CFD(전산유체역학) 연구자가 운영하는 기술 블로그.
**Claude Code가 매일 소스 문서를 읽고 MDX 포스트를 직접 작성 → git commit/push → Cloudflare Pages 자동 배포.**

## 포스트 생성 방법 (핵심)

### API 없이 Claude Code가 직접 생성 (현재 방식)
GitHub Actions + Anthropic API 방식은 크레딧 문제로 사용 안 함.
대신 Claude Code 예약 작업(Scheduled Task)이 매일 오전 10:05 자동 실행.

**수동으로 만들고 싶을 때:** "오늘 포스트 만들어줘" 또는 "월요일 포스트 만들어줘"

**생성 절차:**
1. `source-docs/index.yaml` 읽기
2. 오늘 요일 `day_hint` 문서 선택 (last_used가 null이거나 가장 오래된 것)
3. 해당 문서 파일 읽기
4. `scripts/prompts/{요일}_*.txt` 프롬프트 읽기
5. MDX 포스트 직접 작성
6. `src/content/posts/YYYY-MM-DD-{slug}.mdx` 저장 (draft: true)
7. `source-docs/index.yaml` last_used 업데이트
8. git add → commit → push

## 요일별 포스트 타입
| 요일 | 타입 | 프롬프트 파일 |
|------|------|--------------|
| 월 | CFD 기법 설명 (수식 + 코드) | `scripts/prompts/monday_cfd_technique.txt` |
| 화 | 논문 리뷰 | `scripts/prompts/tuesday_paper_review.txt` |
| 수 | 인터랙티브 시각화 (MDX 컴포넌트) | `scripts/prompts/wednesday_visualization.txt` |
| 목 | OpenFOAM 튜토리얼 | `scripts/prompts/thursday_openfoam.txt` |
| 금 | CFD 실무 Q&A | `scripts/prompts/friday_qa.txt` |

## MDX 필수 형식
```
---
title: "제목"
date: YYYY-MM-DD
description: "한 줄 요약 (50자 이내)"
tags: ["태그1", "태그2"]
draft: true
---
```
- 수식: KaTeX — 인라인 `$수식$`, 블록 `$$수식$$`
- 코드블록: 언어 명시 필수 (` ```python `, ` ```cpp `)
- 생성 직후는 항상 `draft: true`. 사용자가 검토 후 `false`로 변경.

## 수요일 시각화 컴포넌트 (이 목록 외 사용 금지)
```mdx
<VelocityField reynolds={100} animated={true} gridSize={20} />
<StreamLine particles={50} speed={1.0} obstacle="cylinder" />
<NumericalScheme scheme="upwind" order={1} />
<PressureContour levels={10} colormap="viridis" />
<BoundaryCondition type="inlet" interactive={true} />
<NumericalDungeon />
<MachArchitect />
```

## 소스 문서 구조
```
source-docs/
  index.yaml                        ← 문서 목록 + last_used 날짜 관리
  qa-log.md                         ← 금요일 Q&A 입력 (직접 추가 가능)
  notes/
    sample-cfd-note-01.md           ← 월/수 샘플
    sample-openfoam-note-01.md      ← 목 샘플
    sample-paper-review-01.md       ← 화 샘플 (last_used: 2026-03-24)
```

**새 소스 문서 추가하는 법:**
1. 파일을 `source-docs/notes/`에 넣기 (md/pdf/docx 모두 가능)
2. `source-docs/index.yaml`에 항목 추가:
```yaml
- id: 고유-id
  title: "문서 제목"
  path: notes/파일명.md
  type: markdown
  day_hint: monday   # monday/tuesday/wednesday/thursday/friday/any
  tags: [태그1, 태그2]
  last_used: null
```

## 아키텍처
- **Framework:** Next.js 16 (App Router) + Contentlayer2
- **배포:** Cloudflare Pages (main 브랜치 push → 자동 빌드/배포)
- **스타일:** Tailwind CSS + CSS 변수 (`--bg`, `--accent` 등)
- **수식:** KaTeX (rehype-katex)
- **코드 하이라이트:** rehype-pretty-code

## 디자인 시스템 (DESIGN.md 참조)
- Display 폰트: **Fraunces** (variable serif)
- Body 폰트: **Geist**
- Code 폰트: **JetBrains Mono**
- Dark bg: `#08111f` / Accent: `#22d3ee` (시안, viridis cold end)
- Light bg: `#fafaf9` / Accent: `#0e7490`
- 기본 테마: dark
- UI 결정 전 반드시 DESIGN.md 확인

## 예약 작업 (Scheduled Task)
- **이름:** `cfd-daily-post`
- **스케줄:** 매일 오전 10:05 (월~금)
- **관리:** Claude Code 사이드바 → Scheduled 탭
- API 비용 없음. Claude Code가 직접 포스트 작성.

## 주요 파일 위치
| 파일 | 역할 |
|------|------|
| `DESIGN.md` | 디자인 시스템 소스 오브 트루스 |
| `source-docs/index.yaml` | 소스 문서 목록 + 순환 관리 |
| `source-docs/qa-log.md` | 금요일 Q&A 소스 (계속 추가) |
| `scripts/prompts/*.txt` | 요일별 포스트 생성 프롬프트 |
| `scripts/generate_post.py` | API 방식 스크립트 (현재 미사용) |
| `contentlayer.config.ts` | MDX 스키마 (title/date/desc/draft/tags) |
| `src/components/viz/` | 수요일 시각화 컴포넌트 5개 |
| `src/components/MDX.tsx` | MDX 렌더러 + 컴포넌트 등록 |
| `tests/test_generate.py` | pytest 13개 (python -m pytest tests/ -v) |

## 완료된 작업 이력 (2026-03-24)
- GitHub Actions + Claude API 파이프라인 구축 (scripts/)
- 수요일 인터랙티브 시각화 컴포넌트 5개 구현
- Fraunces + Geist + JetBrains Mono 디자인 시스템 적용
- Scheduled Task로 매일 자동 생성 설정
- 첫 번째 포스트 생성: PINN 논문 리뷰 (draft: false, 배포됨)

## 자주 쓰는 명령
```bash
# 개발 서버
npm run dev

# 빌드 확인
npm run build

# 테스트
python -m pytest tests/ -v

# 수동 포스트 테스트 (API 방식, 현재 미사용)
python scripts/generate_post.py monday
```
