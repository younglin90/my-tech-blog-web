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
- **Key risk (deliberate):** 기술 블로그에 세리프 폰트(Fraunces) 사용 — "논문처럼 진지한 지식"을 전달. 앰버/네이비 팔레트("HPC Terminal") — 딥 네이비 위 따뜻한 앰버 accent로 터미널·계기판 미감을 강조.

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

- **Approach:** restrained — 앰버 1개 accent + 네이비 계열 neutrals("HPC Terminal"). 컬러는 희귀하고 의미 있게.
- **Source of truth:** `src/styles/globals.css`. 이 표는 그 값과 동기화된 상태이며, 충돌 시 globals.css가 우선한다.

### Dark Mode (primary — CFD 엔지니어 선호)
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#08111f` | 페이지 배경 (딥 네이비, HPC 터미널) |
| `--surface` | `#162943` | 카드, 코드블록, 헤더 배경 |
| `--surface-hover` | `#1f3557` | hover 상태 |
| `--border` | `#2c4a70` | 구분선, 카드 테두리 |
| `--accent` | `#fbbf24` | 링크, 강조, 인터랙티브 요소 (앰버 — 계기판/터미널) |
| `--accent-dim` | `#d97706` | accent hover, 눌린 상태 |
| `--accent-glow` | `color-mix(accent 15%)` | accent 배경 hint (필터 pill 등) |
| `--text` | `#e2e8f0` | 본문 텍스트 |
| `--text-muted` | `#a8b3c4` | 날짜, 설명, 보조 텍스트 |
| `--text-faint` | `#7a8599` | 플레이스홀더, 비활성 |
| `--code-bg` | `#0e1b2e` | 코드 블록 배경 |

### Light Mode
| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#fafaf9` | 페이지 배경 (따뜻한 흰색) |
| `--surface` | `#f1f5f9` | 카드, 헤더 |
| `--border` | `#cbd5e1` | 구분선 |
| `--accent` | `#b45309` | 링크, 강조 (오렌지) |
| `--accent-dim` | `#78350f` | accent hover, 눌린 상태 |
| `--text` | `#0f172a` | 본문 |
| `--text-muted` | `#475569` | 보조 |
| `--text-faint` | `#64748b` | 플레이스홀더, 비활성 |
| `--code-bg` | `#f8fafc` | 코드 블록 |

### Semantic Colors
| Token | Dark | Light | Usage |
|-------|------|-------|-------|
| success | `#34d399` | `#059669` | 성공, PR 생성 완료 |
| warning | `#fbbf24` | `#d97706` | 경고, HWP 파싱 실패 |
| error | `#f87171` | `#dc2626` | 오류, API 실패 |
| info | `#60a5fa` | `#2563eb` | 정보, 자동화 상태 |

### 요일별 배지 색상 (dark 기준 — `--day-mon..sun`, light 테마는 globals.css에 별도 값)
| 요일 | Accent (dark) | Usage |
|------|--------|-------|
| 월 | `#22d3ee` | 시안 |
| 화 | `#60a5fa` | 블루 |
| 수 | `#34d399` | 그린 |
| 목 | `#fbbf24` | 옐로 |
| 금 | `#f87171` | 레드 |
| 토 | `#a78bfa` | 바이올렛 |
| 일 | `#2dd4bf` | 틸 |

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
- **Approach:** minimal-functional — 수식/코드를 읽는 **본문/리딩 서피스**에서는 의미 있는 전환만.
  단, 홈 진입에는 **단 한 번의 잘 오케스트레이션된 페이지-로드 계단식 등장(staggered reveal)**을
  승인한다. "산발적 마이크로 인터랙션보다 한 번의 로드 오케스트레이션이 더 큰 delight를 준다"는 원칙.
- **Page-load reveal (승인):** `reveal-up` 키프레임(opacity 0→1 + translateY 10px→0, ~500ms, ease-out, `both`).
  홈 히어로=step0 → 주간 바=step1 → 다음 섹션=step2~3, PostList 초기 SSR 행은 40ms 간격으로 최대 10행까지.
  전체 오케스트레이션 ≤ ~700ms. 무한스크롤로 append되는 행은 재애니메이션하지 않는다(첫 10행 nth-child cap).
  `<main>`에는 translateY reveal을 걸지 않는다 — fixed 자식(ToC/ReadingProgress)의 containing-block 버그 방지.
- **Ambient background (승인):** `body::before/::after`로 얹는 정적 분위기 레이어 — 상단 amber glow,
  우하단 딥블루 wash, 상단만 노출되는 CFD 메쉬 그리드(mask로 mid-page 소멸). 매우 은은하게, 가독성 우선.
  모든 서피스는 `--bg` 색으로 위를 덮어 그리드가 비치지 않는다. `prefers-reduced-motion` 및 인쇄에서 비활성.
- **Hero signature (승인):** 히어로 하단 유선(streamline) 언더라인 — accent→cyan 그라디언트가 10s로 드리프트.
  1~2px, 저채도. 흐름장 미감을 도메인 정체성으로 살린 단 하나의 시그니처 모먼트.
- **Easing:** enter: `ease-out` / exit: `ease-in` / move: `ease-in-out`
- **Duration:**
  | Token | Range | Usage |
  |-------|-------|-------|
  | micro | 50-100ms | hover 색상 변화 |
  | short | 150-250ms | 버튼 상태, 포커스 |
  | medium | 250-400ms | 페이지 전환 |
  | long | 400-700ms | viz 컴포넌트 초기화, 페이지-로드 reveal |
- **Never:** **스크롤 기반(scroll-triggered) 애니메이션**, 장식용 로딩 스피너, parallax.
  (승인된 페이지-로드 reveal은 스크롤이 아닌 로드 1회성이므로 이 금지에 해당하지 않는다.)
- **Reduced motion:** 위 모든 승인 항목은 `@media (prefers-reduced-motion: reduce)`에서 `animation: none`.

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
| 2026-07-10 | Accent 앰버 doc-sync (dark `#fbbf24` / light `#b45309`) | 라이브 "HPC Terminal" 테마는 이미 앰버. 문서가 옛 시안(`#22d3ee`)으로 stale → globals.css 실제값에 맞춰 Color 섹션 정정. |
| 2026-07-10 | Atmospheric layered background | 단색 배경 대신 amber glow + 딥블루 wash + CFD 메쉬 그리드(mask)로 깊이. anti-AI-slop, 도메인(유동/메쉬) 정체성. 서피스가 --bg로 덮어 가독성 유지. |
| 2026-07-10 | Load-reveal orchestration + hero streamline | 홈 진입 1회 계단식 등장(≤700ms) + 히어로 유선 언더라인. 산발적 마이크로 인터랙션 대신 한 번의 오케스트레이션. LCP 무해(opacity/translateY, 스크롤 무관), reduced-motion 대응. |
