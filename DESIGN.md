# Design System — CFD.Lab Tech Blog

## Product Context
- **What this is:** CFD(전산유체역학) 연구자가 운영하는 기술 저널 블로그. AI가 매일 포스트를 자동 생성하고 사람이 PR로 검토 후 배포.
- **Who it's for:** CFD 실무 엔지니어 — OpenFOAM, Fluent, Star-CCM+ 사용자. 수식과 코드를 이해하는 분석적 사고의 독자.
- **Space/industry:** 공학/과학 기술 블로그. 학술 저널과 개발자 블로그의 교차점.
- **Project type:** Editorial tech blog (Next.js + Contentlayer, Cloudflare Pages)

## Aesthetic Direction
- **Direction:** Editorial/Technical
- **Decoration level:** intentional — 인터랙티브 viz 컴포넌트가 비주얼 역할 담당. 배경 장식 최소화.
- **Mood:** 학술 저널의 권위와 정밀함. HPC 터미널의 침착함. 수요일 시각화 컴포넌트가 페이지의 에너지를 담당.
- **Key risk (deliberate):** 기술 블로그에 세리프 폰트(Fraunces) 사용 — "논문처럼 진지한 지식"을 전달. 시안/네이비 팔레트 — CFD 컬러맵(viridis)에서 추출, viz 컴포넌트와 도메인 정체성 일치.

## Typography

- **Display/Hero:** Fraunces — variable optical serif. 기술 블로그에서 비관례적이지만 학술 권위감 전달. 제목/포스트 타이틀.
- **Body:** Geist — 숫자·코드 친화적, tabular-nums 지원. 본문·UI 레이블.
- **UI/Labels:** Geist (body와 동일)
- **Data/Tables:** Geist (tabular-nums feature 활성화)
- **Code:** JetBrains Mono — 리거처 지원, 코드 블록 최적화.
- **Loading:** Google Fonts CDN
  ```
  Fraunces: ital,opsz,wght@0,9..144,300..900;1,9..144,300..900
  Geist: wght@300;400;500;600
  JetBrains Mono: ital,wght@0,400;0,500;1,400
  ```
- **Scale:**
  | Token | Size | Usage |
  |-------|------|-------|
  | hero | 3rem / 2.4rem clamp | 홈 히어로, 대형 타이틀 |
  | title | 2rem | 포스트 제목 |
  | section | 1.4rem | 섹션 헤딩 (h2) |
  | body | 1rem | 본문 (line-height 1.75) |
  | small | 0.88rem | 설명, 메타데이터 |
  | label | 0.72rem | 태그, 날짜, 모노 레이블 |

## Color

- **Approach:** restrained — 시안 1개 accent + 네이비 계열 neutrals. 컬러는 희귀하고 의미 있게.

### Dark Mode (primary — CFD 엔지니어 선호)
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#08111f` | 페이지 배경 (딥 네이비, HPC 터미널) |
| `--surface` | `#0f1d2e` | 카드, 코드블록, 헤더 배경 |
| `--surface-hover` | `#162540` | hover 상태 |
| `--border` | `#1e3a5f` | 구분선, 카드 테두리 |
| `--accent` | `#22d3ee` | 링크, 강조, 인터랙티브 요소 (viridis colormap cold end) |
| `--accent-dim` | `#0e7490` | accent hover, 눌린 상태 |
| `--text` | `#e2e8f0` | 본문 텍스트 |
| `--text-muted` | `#64748b` | 날짜, 설명, 보조 텍스트 |
| `--text-faint` | `#334155` | 플레이스홀더, 비활성 |
| `--code-bg` | `#060d18` | 코드 블록 배경 |

### Light Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#fafaf9` | 페이지 배경 (따뜻한 흰색) |
| `--surface` | `#f1f5f9` | 카드, 헤더 |
| `--border` | `#cbd5e1` | 구분선 |
| `--accent` | `#0e7490` | 링크, 강조 |
| `--text` | `#0f172a` | 본문 |
| `--text-muted` | `#64748b` | 보조 |
| `--code-bg` | `#f8fafc` | 코드 블록 |

### Semantic Colors
| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| success | `#34d399` | `#059669` | 성공, PR 생성 완료 |
| warning | `#fbbf24` | `#d97706` | 경고, HWP 파싱 실패 |
| error | `#f87171` | `#dc2626` | 오류, API 실패 |
| info | `#60a5fa` | `#2563eb` | 정보, 자동화 상태 |

### 요일별 배지 색상
| 요일 | Accent | Usage |
|------|--------|-------|
| 월 (CFD기법) | `#22d3ee` | 시안 |
| 화 (논문리뷰) | `#60a5fa` | 블루 |
| 수 (시각화) | `#34d399` | 그린 |
| 목 (OpenFOAM) | `#fbbf24` | 옐로 |
| 금 (Q&A) | `#f87171` | 레드 |

## Spacing
- **Base unit:** 8px
- **Density:** comfortable
- **Scale:**
  | Token | Value |
  |-------|-------|
  | 2xs | 2px |
  | xs | 4px |
  | sm | 8px |
  | md | 16px |
  | lg | 24px |
  | xl | 32px |
  | 2xl | 48px |
  | 3xl | 64px |
  | 4xl | 80px |

## Layout
- **Approach:** grid-disciplined — 좁은 reading column, full-bleed for viz components
- **Grid:** 1 column (reading-focused)
- **Max content width:** 672px (max-w-2xl, 현재 유지)
- **Viz components:** full-bleed (max-w 제한 없음, 컨테이너 밖으로)
- **Border radius:**
  | Token | Value | Usage |
  |-------|-------|-------|
  | r-sm | 4px | 태그, 작은 배지 |
  | r-md | 8px | 버튼, 인풋, 코드블록 |
  | r-lg | 12px | 카드, viz 컨테이너 |
  | r-xl | 16px | 모달, 대형 카드 |
  | r-full | 9999px | pill 태그 |

## Motion
- **Approach:** minimal-functional — 수식/코드를 읽는 환경. 의미 있는 전환만.
- **Easing:** enter: `ease-out` / exit: `ease-in` / move: `ease-in-out`
- **Duration:**
  | Token | Range | Usage |
  |-------|-------|-------|
  | micro | 50-100ms | hover 색상 변화 |
  | short | 150-250ms | 버튼 상태, 포커스 |
  | medium | 250-400ms | 페이지 전환 |
  | long | 400-700ms | viz 컴포넌트 초기화 |
- **Never:** 스크롤 기반 애니메이션, 장식용 로딩 애니메이션, parallax

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-24 | Fraunces (Display) | 기술 블로그에서 세리프 = 학술 권위감. Inter와 차별화. |
| 2026-03-24 | Geist (Body) | tabular-nums, 숫자/코드 친화적. 현재 Inter에서 교체. |
| 2026-03-24 | JetBrains Mono (Code) | 리거처, 코드 가독성. 변경 없음 (이미 최선). |
| 2026-03-24 | #08111f Background | 딥 네이비 = HPC 터미널 미감. #09090b(zinc-950)보다 따뜻한 파란 기운. |
| 2026-03-24 | #22d3ee Accent | viridis colormap cold end. viz 컴포넌트와 팔레트 통일. |
| 2026-03-24 | max-w-2xl 유지 | 현재 reading width 적절. 변경 없음. |
| 2026-03-24 | 요일별 배지 색상 5종 | 콘텐츠 유형을 시각적으로 빠르게 구분. |
