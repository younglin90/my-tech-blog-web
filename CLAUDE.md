# CFD.Lab — Claude Code 프로젝트 가이드

## 이 프로젝트가 무엇인가
CFD(전산유체역학) 연구자가 운영하는 기술 블로그.
**Claude Code가 매일 소스 문서를 읽고 MDX 포스트를 직접 작성 → git commit/push → Cloudflare Pages 자동 배포.**

## 포스트 생성 방법 (핵심)

### API 없이 Claude Code가 직접 생성 (현재 방식)
GitHub Actions + Anthropic API 방식은 크레딧 문제로 사용 안 함.
대신 Claude Code 예약 작업(Scheduled Task)이 매일 오전 10:05 자동 실행.

**수동 트리거:** "오늘 포스트 만들어줘" / "월요일 포스트 만들어줘" / "/daily-post"

---

## 매일 루틴 지침 (Scheduled Task / 수동 모두 동일)

### 목표
오늘 날짜로 CFD 블로그 포스트 **1개를 자동 생성 → main branch에 push** (Cloudflare Pages 자동 배포).

### 요일 → 그룹 매핑
| 요일 | 그룹 | 프롬프트 파일 |
|------|------|---------------|
| 월/수/금 | `cfd_technique` — CFD 기법 + 알고리즘 구현 | `scripts/prompts/cfd_technique.txt` |
| 화/목 | `fluid_mechanics` — 유체역학 이론 + 흥미로운 유동 현상 | `scripts/prompts/fluid_mechanics.txt` |
| 토/일 | `paper_review` — CFD 논문 리뷰 + 구현 재현 | `scripts/prompts/paper_review.txt` |

모든 그룹은 **인터랙티브 시각화 컴포넌트 1~2개를 필수 포함**한다 (목록: `scripts/prompts/_viz_components.txt`).

### 실행 순서

1. **중복 체크 (날짜)** — `src/content/posts/YYYY-MM-DD-*.mdx`가 이미 있으면 "이미 있음" 한 줄 출력 후 종료.
2. **소스 문서 선택** — `source-docs/index.yaml` 로드. 오늘 요일 그룹에 해당하는 `day_hint` 값(또는 `any`)을 가진 문서 중, `last_used`가 null이거나 가장 오래된 것 **하나** 선택.
   - 월/수/금 그룹 → `day_hint ∈ {monday, wednesday, friday, any}`
   - 화/목 그룹 → `day_hint ∈ {tuesday, thursday, any}`
   - 토/일 그룹 → `day_hint ∈ {saturday, sunday, any}`
   - 금요일인데 `source-docs/qa-log.md`에 새 항목이 있으면 그것을 우선 소스로 사용.
   - 후보가 없으면: "건너뜀 — 오늘 그룹에 맞는 문서 없음" 한 줄 출력 후 종료.
2a. **중복 체크 (주제)** — 소스 문서 선택 후, 기존 포스트 제목·태그와 주제 중복 여부를 확인한다.
   - `src/content/posts/*.mdx` 전체의 `title`과 `tags` frontmatter를 읽는다.
   - 선택된 소스 문서의 핵심 키워드(파일명·tags 기준)가 기존 포스트 제목/태그에 이미 등장하면 해당 소스는 건너뛰고 **그 다음 후보 문서**를 선택한다 (최대 3회 시도).
   - 3회 모두 중복이면: "건너뜀 — 주제 중복 없는 문서 없음" 한 줄 출력 후 종료.
3. **소스 읽기** — 선택된 문서 (`source-docs/{path}`) 내용 로드.
4. **프롬프트 로드 + 치환** — 그룹별 프롬프트에서 `{VIZ_COMPONENTS}`를 `_viz_components.txt` 내용으로, `{SOURCE_CONTENT}`를 소스 문서 내용으로, `{DATE}`를 오늘 날짜로 치환.
5. **MDX 포스트 작성** — 프롬프트 지침을 그대로 따른다. 아래 **글 규칙** 반드시 준수.
6. **저장** — `src/content/posts/YYYY-MM-DD-{영문-slug}.mdx`에 저장. **`draft: false`** (즉시 공개).
7. **인덱스 업데이트** — 방금 사용한 문서의 `last_used`를 오늘 날짜(`YYYY-MM-DD`)로 업데이트.
8. **git 커밋/푸시** — `main` 브랜치에 바로 push. 커밋 메시지: `post: {요일} 자동 생성 - {포스트 제목}`.
9. **결과 보고** — 파일 경로 + 제목 한 줄.

### 글 규칙 (프롬프트 지침과 함께 지킬 것)
- **총 분량**: 4~7분 읽기 분량 (한국어 기준 **1,000~1,700단어**, 공백 제외 약 2,500~4,500자).
- **도입부**: 3~5문장 안에 포스트의 핵심과 독자가 얻을 것을 밝힐 것.
- **문장**: 짧게. 복합문 지양. 기술 용어는 처음 등장 시 한 줄 풀이.
- **문단**: 한 문단 = 한 주제, **최대 5문장**. 긴 설명은 섹션을 나눈다.
- **수식**: KaTeX — 인라인 `$...$`, 블록 `$$...$$`. 수식 뒤에는 반드시 변수/기호의 의미를 한 줄로.
  - **멀티라인 블록 수식 규칙**: `$$`는 반드시 **독립 라인**에 위치해야 한다. 수식 내용과 같은 줄에 `$$`를 쓰면 remark-math 파싱 오류가 발생한다.
    ```
    $$                   ← 올바름 (단독 라인)
    \int ... d\Omega \\
    + \oint ... d\Gamma
    $$                   ← 올바름 (단독 라인)
    ```
    단일라인 수식은 `$$수식$$` 형태도 허용: `$$E = mc^2$$`
- **코드 블록**: 언어 명시 (` ```python `, ` ```cpp `, ` ```fortran `). 돌아가는 코드여야 함 (토이 문제 OK).
- **시각화 컴포넌트**: 본문 중 1~2개 삽입. 삽입 전 1문장 안내, 삽입 후 관찰 포인트 1~2문장.
- **결론**: 마지막에 "핵심 3줄 요약" 또는 "기억할 점" 섹션으로 마무리.

### 실패 처리
어느 단계에서 멈추든 명시적으로 어떤 단계에서 왜 실패했는지 보고한다. 부분 결과물이 남았다면 파일 경로를 알려준다.

### MDX frontmatter 템플릿
```yaml
---
title: "구체적이고 검색 친화적인 제목"
date: YYYY-MM-DD
description: "한 문장 요약 (50자 이내)"
tags: ["CFD", "그룹태그", "세부태그"]
draft: false
---
```

## MDX 기타 규정
- 수식: KaTeX — 인라인 `$수식$`, 블록 `$$수식$$`
- 코드블록: 언어 명시 필수 (` ```python `, ` ```cpp `, ` ```fortran `)
- `draft: false` 로 즉시 공개 (Cloudflare Pages가 main push 감지 → 자동 배포)
- 한 포스트에 인터랙티브 시각화 컴포넌트 **1~2개 필수**

## 시각화 컴포넌트 (이 목록 외 사용 금지)
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

## Admin 패널 (`/admin`)
- 로그인: SHA-256 해시 비교 (평문 미저장)
- 패스워드 해시: `.env.local`의 `NEXT_PUBLIC_ADMIN_PASSWORD_HASH`
- Cloudflare Pages 배포 시 Environment variables에도 동일하게 설정 필요
- 해시 생성: `node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('비밀번호')).then(b => console.log(Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')))"`
- 동적 포스트 저장소: localStorage (기기 종속)
- **Export JSON** / **Import JSON** 버튼으로 기기 간 데이터 이동 가능

## 주요 파일 위치
| 파일 | 역할 |
|------|------|
| `DESIGN.md` | 디자인 시스템 소스 오브 트루스 |
| `.env.local` | 어드민 패스워드 해시 (gitignore됨) |
| `.env.local.example` | 환경변수 템플릿 |
| `source-docs/index.yaml` | 소스 문서 목록 + 순환 관리 |
| `source-docs/qa-log.md` | 금요일 Q&A 소스 (계속 추가) |
| `scripts/prompts/*.txt` | 요일별 포스트 생성 프롬프트 |
| `scripts/generate_post.py` | API 방식 스크립트 (현재 미사용) |
| `contentlayer.config.ts` | MDX 스키마 (title/date/desc/draft/tags) |
| `src/components/viz/` | 수요일 시각화 컴포넌트 5개 |
| `src/components/MDX.tsx` | MDX 렌더러 + 컴포넌트 등록 (헤딩 앵커 포함) |
| `src/components/BackToTop.tsx` | 스크롤 400px 이후 우하단 버튼 |
| `src/components/ShareButton.tsx` | Copy link + Twitter + LinkedIn 공유 |
| `src/components/ReadingProgress.tsx` | 상단 읽기 진행 바 |
| `src/components/CodeBlock.tsx` | 코드블록 복사 버튼 + 긴 코드 확장/축소 |
| `src/components/TableOfContents.tsx` | xl 고정 사이드바 + 모바일 인라인 접힘 ToC |
| `src/components/Search.tsx` | ⌘K/Ctrl+K 검색 모달 (하이라이트, OS 감지) |
| `src/components/MobileNav.tsx` | 모바일 바텀 네비게이션 (sm 미만) |
| `src/components/KeyboardShortcuts.tsx` | '?' 단축키 모달 (g+h/t/a 이동) |
| `src/components/ReadingETA.tsx` | 스크롤 기반 읽기 예상 시간 표시 |
| `src/app/sitemap.ts` | Next.js 네이티브 sitemap.xml |
| `src/app/robots.ts` | Next.js 네이티브 robots.txt |
| `src/app/manifest.ts` | PWA web app manifest |
| `src/lib/dynamic-posts.ts` | Admin 동적 포스트 CRUD + export/import |
| `src/app/admin/layout.tsx` | Admin noindex 메타 |
| `src/app/preview/layout.tsx` | Preview noindex 메타 |
| `src/app/read/layout.tsx` | Read 페이지 noindex 메타 |
| `scripts/generate-rss.mjs` | RSS + Sitemap 생성 (카테고리, 우선순위 포함) |
| `tests/test_generate.py` | pytest 13개 (python -m pytest tests/ -v) |

## 완료된 작업 이력

### 2026-03-24
- GitHub Actions + Claude API 파이프라인 구축 (scripts/)
- 수요일 인터랙티브 시각화 컴포넌트 5개 구현
- Fraunces + Geist + JetBrains Mono 디자인 시스템 적용
- Scheduled Task로 매일 자동 생성 설정
- 첫 번째 포스트 생성: PINN 논문 리뷰 (draft: false, 배포됨)

### 2026-03-28 (1차)
- **보안**: Admin 패스워드를 소스코드 평문 → `.env.local` SHA-256 해시로 이전
- **Admin**: Export/Import JSON으로 동적 포스트 기기 간 백업/복원 가능
- **MDX**: h1~h4 헤딩에 hover 앵커 링크 추가 (Korean slug 지원)
- **UX**: BackToTop 버튼 (우하단, 400px 스크롤 후 등장)
- **모바일**: Nav 레이블 sm 미만에서 숨김, 헤더 padding 모바일 대응
- **MDX**: table/hr 디자인 토큰(`var(--border)`, `var(--surface)`) 통일
- **포스트 페이지**: 공유 버튼(Copy link + Twitter), 관련 포스트 섹션 추가
- **다크모드**: `--text-muted` 명도 개선 (`#64748b` → `#7a90a8`)
- **SEO**: `src/app/sitemap.ts` 추가 (전체 포스트 자동 색인)

### 2026-03-28 (2차 — 자율 개선 루프)
- **빌드 수정**: CRLF→LF, `.gitattributes`, onMouseEnter→CSS 클래스, feed.xml/sitemap.ts Route Handler 삭제
- **CSS 토큰**: `.link-hover-*`, `.tag-pill`, `.tag-pill-sm` hover 유틸리티 클래스
- **MDX**: 외부 링크 ↗ 아이콘, 코드 언어 뱃지 (좌측), `<kbd>`, `<mark>`, `<abbr>`, `sup`/`sub`, `details`/`summary`, `figure`/`figcaption`, GFM 각주, Callout (Note/Tip/Warning/Caution)
- **TableOfContents**: xl 화면 우측 고정 사이드바, IntersectionObserver 활성 추적, 좌측 인디케이터 바
- **CodeBlock**: 420px 초과 시 Expand/Collapse 버튼, 줄 번호 user-select:none, 단어 하이라이팅 CSS
- **PostList**: 연도별 그룹핑 + sticky 연도 레이블, hover 배경, 설명 line-clamp-2
- **SEO**: canonical URL (포스트/about/tags/[tag]), JSON-LD (WebSite/TechArticle/BreadcrumbList/Person), wordCount 필드, sitemap changefreq/priority, RSS 카테고리 태그
- **검색**: 날짜 표시, OS별 단축키(⌘K/Ctrl K), 최대 결과 8개
- **공유**: LinkedIn 버튼 추가
- **About**: 통계 카드 (포스트 수/총 단어/태그 수)
- **CSS**: smooth scroll, ::selection 색상, 프린트 스타일, focus-visible 링, 목록 마커 accent 색상
- **noindex**: admin/preview/read 레이아웃에 robots noindex 적용
- **remark-gfm**: contentlayer에 플러그인 활성화 (strikethrough, task list)
- **404**: CFD 테마 메시지 + Browse Tags 버튼

### 2026-03-28 (3차 — 자율 개선 루프 계속)
- **중첩 리스트**: ul>ul→circle, ul>ul>ul→square, ol>ol→lower-alpha CSS
- **Prev/Next 카드**: 포스트 이전/다음 네비게이션을 bordered card grid UI로 개선
- **sitemap.ts + robots.ts**: Next.js 네이티브 생성 (정적 익스포트 대응, `force-static`)
- **MobileNav**: 모바일 바텀 네비게이션 (Posts/Tags/About, sm 미만에서만 표시)
- **태그 필터 바**: 홈 PostList 상단에 태그 클릭 필터링 (인라인, 페이지 이동 없음)
- **AnchorLink**: 클릭 시 "Copied!" 툴팁 1.5초 표시
- **태그 클라우드**: 빈도에 비례한 크기/투명도 태그 pill (Tags 페이지)
- **manifest.ts**: PWA 기본 web app manifest
- **search 하이라이트**: 검색어와 매칭되는 텍스트를 제목/설명에서 강조
- **BackToTop**: 모바일 바텀 nav 위로 위치 이동 (bottom-20 sm:bottom-8)
- **ToC 모바일**: xl 미만 화면에 접힘/펼침 인라인 목차 추가
- **Related Tags**: 태그 페이지 하단에 함께 쓰인 태그 표시 (빈도순 8개)
- **ReadingETA**: 스크롤에 따라 '~N min left' 동적 표시
- **MDX img**: width:100% + height:auto 반응형 처리
- **KeyboardShortcuts**: '?' 키로 토글, g+h/g+t/g+a 이동, Mac/Win 구분
- **text-faint 다크모드**: #334155 → #4a6280 (대비비 개선)
- **RSS**: 홈 헤더 RSS 아이콘 링크 추가
- **preconnect**: jsDelivr/Google Fonts CDN 사전 연결 힌트

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
