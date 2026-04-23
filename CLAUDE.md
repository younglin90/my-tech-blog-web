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

### 요일 → 주제 폴더 매핑
| 요일 | 주제 | 소스 폴더 | 프롬프트 파일 |
|------|------|-----------|---------------|
| 월/수/금 | CFD 기법 + 알고리즘 구현 | `source-docs/cfd-technique/` | `scripts/prompts/cfd_technique.txt` |
| 화/목 | 유체역학 이론 + 유동 현상 | `source-docs/fluid-mechanics/` | `scripts/prompts/fluid_mechanics.txt` |
| 토/일 | 논문 리뷰 + 구현 재현 | `source-docs/paper-review/` | `scripts/prompts/paper_review.txt` |

모든 그룹은 **인터랙티브 시각화 컴포넌트 1~2개를 필수 포함**한다 (목록: `scripts/prompts/_viz_components.txt`).

### 실행 순서

1. **중복 체크 (날짜)** — `src/content/posts/YYYY-MM-DD-*.mdx`가 이미 있으면 "이미 있음" 한 줄 출력 후 종료.

2. **소스 문서 선택** — 오늘 요일에 해당하는 주제 폴더에서 파일을 선택한다.
   - `source-docs/index.yaml`의 `last_used` 딕셔너리를 로드한다. 값은 `"YYYY-MM-DD"` 문자열(구 스키마) 또는 `[{date, sections[]}, ...]` 목록(신 스키마) 둘 다 지원 — 문자열이면 `[{date, sections: []}]`로 정규화해 처리한다.
   - 해당 폴더 전체의 `.md` / `.txt` 파일 목록을 재귀적으로 수집한다.
   - 우선순위:
     1. `last_used`에 **없는(미사용) 파일**
     2. **30일 이상 사용 이력 없는 파일**
     3. 최신 사용일이 가장 오래된 파일
   - 상위 후보 중 **랜덤으로 1개** 선택.
   - 해당 폴더가 비어있으면: "건너뜀 — `{폴더명}`에 소스 파일 없음" 한 줄 출력 후 종료.
     - 특히 `paper-review/`는 현재 0개 → 토·일 포스팅이 중단된다. 사용자가 논문 요약 `.md`를 주입하기 전까지 "건너뜀"으로 동작.

2a. **중복 체크 (주제)** — 선택한 파일의 제목·키워드가 기존 포스트와 겹치는지 확인한다.
   - `src/content/posts/*.mdx` 전체의 `title`과 `tags` frontmatter를 읽는다.
   - 선택 파일명·첫 줄 제목의 핵심 키워드가 기존 포스트와 중복이면 다음 후보를 선택한다 (최대 3회).
   - 3회 모두 중복이면: "건너뜀 — 주제 중복 없는 문서 없음" 한 줄 출력 후 종료.

3. **소스 읽기** — 선택된 파일을 아래 규칙으로 읽는다.
   - **200줄 이하**: 파일 전체 읽기.
   - **200줄 초과**: 앞 150줄 + `##` 섹션 헤딩 목록을 읽어 핵심 섹션 1~2개를 추가 로드 (총 300줄 이내).
     - 해당 파일이 과거에 사용된 이력이 있으면 `last_used[...].sections`에 기록된 섹션은 **제외**하고 다른 섹션을 선택한다.

4. **프롬프트 로드 + 치환** — 그룹별 프롬프트 파일에서:
   - `{VIZ_COMPONENTS}` → `scripts/prompts/_viz_components.txt` 내용
   - `{MULTILINGUAL}` → `scripts/prompts/_multilingual.txt` 내용 (5개 locale 동시 작성 지침)
   - `{SOURCE_CONTENT}` → 읽어온 소스 내용
   - `{DATE}` → 오늘 날짜 (`YYYY-MM-DD`)
   - `{RECENT_POSTS}` → 아래 4b에서 빌드한 YAML 블록
   - `{USED_VIZ_COMPONENTS}` → 최근 10개에서 쓰인 viz 컴포넌트 이름 (쉼표 구분)
   - `{USED_CODE_SIGNATURES}` → 최근 10개에서 쓰인 클래스/함수 시그니처 (쉼표 구분)

4b. **최근 포스트 컨텍스트 빌드** — `src/content/posts/*.mdx`를 `date` 내림차순으로 정렬해 **최근 10개**를 로드한다. 각 포스트에서 아래만 추출(본문 전체 주입 금지):
   - `title`, `tags`
   - 본문의 `##` 섹션 헤딩 전체 목록
   - 사용된 viz 컴포넌트 이름 (`<(VelocityField|StreamLine|NumericalScheme|PressureContour|BoundaryCondition|NumericalDungeon|MachArchitect)` 매칭)
   - 코드블록 첫 줄 시그니처 (예: `class RigidBody:`, `def quaternion_multiply(q1, q2):`)
   - 도입부 첫 문장
   다음 YAML 형식으로 포맷:
   ```yaml
   recent_posts:
     - date: "2026-04-21"
       title: "..."
       tags: ["CFD", ...]
       viz: ["VelocityField", "StreamLine"]
       sections: ["도입", "수식", "코드", ...]
       code_signatures: ["def reynolds(U, L, nu)"]
       opening: "박테리아는 수영을 할 수 없다. ..."
     - ...
   ```
   이 블록이 `{RECENT_POSTS}` 토큰에 그대로 주입된다.

5a. **포스트 전용 viz 컴포넌트 생성 (권장, 기본 경로)** — 오늘 포스트 내용에 **정확히 맞는** custom React 컴포넌트 1~2개를 `src/components/post-viz/{오늘 slug}/{ComponentName}.tsx`에 **즉석에서 작성**한다.
   - 파일 첫 줄: `'use client'`
   - 외부 라이브러리 추가 금지 (이미 설치된 `react`, 내장 Canvas/SVG API, `@/lib/*`만 사용)
   - Props는 최소화. 내부 state(`useState`) + 슬라이더/버튼 등으로 파라미터 조작 UI 구성
   - Canvas 렌더링은 `requestAnimationFrame` + cleanup in useEffect — 60fps 유지, gridSize 100 이하 권장
   - 컴포넌트 이름은 **주제 반영 + 전역 유일**(예: `RiemannShockTube1D`, `BernoulliJetDemo`, `LBMBGKCollision`, `KarmanStreetCanvas`)
   - 각 파일은 독립적. 같은 slug 폴더에 2개까지.
   - 하위 호환: `src/components/post-viz/` 폴더가 없으면 먼저 만든다.

5b. **MDX 포스트 작성 + import** — 프롬프트 지침 + **글 규칙** 준수.
   - frontmatter 바로 아래에 `import { ... } from '@/components/post-viz/{slug}/ComponentName'` 라인 추가
   - 본문에서 `<ComponentName />` 사용
   - **viz 0개 초안은 실패 — 재작성한다. (custom 1개 이상 또는 pre-built 1개 이상)**
   - 예시:
     ```mdx
     ---
     title: "..."
     date: 2026-04-22
     ...
     ---

     import { RiemannShockTube1D } from '@/components/post-viz/2026-04-22-riemann-shock/RiemannShockTube1D'

     (본문 서두)

     <RiemannShockTube1D />
     ```

5c. **fallback (특수 경우에만)** — 포스트 주제가 `_viz_components.txt`의 주제→컴포넌트 매핑 표와 **정확히** 일치하고, custom 제작 비용이 큰 경우 pre-built 7개 중 하나를 **대안으로** 사용 가능. 단 `{USED_VIZ_COMPONENTS}` 중복 회피 규칙은 동일하게 적용. 주제가 조금이라도 벗어나면 pre-built 대신 custom 작성이 원칙.

6. **저장 (5개 locale 동시)** — 동일 slug로 5개 파일을 작성한다:
   - `src/content/posts/ko/YYYY-MM-DD-{영문-slug}.mdx` (한국어, primary)
   - `src/content/posts/en/YYYY-MM-DD-{영문-slug}.mdx` (English)
   - `src/content/posts/ja/YYYY-MM-DD-{영문-slug}.mdx` (日本語)
   - `src/content/posts/zh/YYYY-MM-DD-{영문-slug}.mdx` (简体中文)
   - `src/content/posts/es/YYYY-MM-DD-{영문-slug}.mdx` (Español)

   각 파일 frontmatter에 `locale`(ko/en/ja/zh/es)과 `slug`(공통 영문) 필드 포함. **`draft: false`**. post-viz 컴포넌트는 단 1번만 작성하고 5개 locale 모두 같은 import 경로 사용.

7. **인덱스 업데이트** — `source-docs/index.yaml`의 `last_used`에 다음 형식으로 갱신한다.
   ```yaml
   last_used:
     {상대경로}:
       - date: "YYYY-MM-DD"
         sections: ["오늘 쓴 섹션1", "오늘 쓴 섹션2"]   # 3단계에서 읽은 섹션 이름들
   ```
   기존 entry가 있으면 목록에 append한다.

8. **git 커밋/푸시** — `main` 브랜치에 바로 push. 5개 locale + post-viz + index.yaml을 한 커밋으로:
   ```bash
   git add \
     src/content/posts/{ko,en,ja,zh,es}/YYYY-MM-DD-*.mdx \
     src/components/post-viz/YYYY-MM-DD-*/ \
     source-docs/index.yaml
   git commit -m "post: {요일} 자동 생성 [5 locales] - {ko 제목}"
   git push origin main
   ```

9. **결과 보고** — 파일 경로 + 제목 한 줄.

### 글 규칙
- **분량**: 4~7분 읽기 = 한국어 **1,000~1,700단어** (공백 제외 약 2,500~4,500자). 코드·수식은 카운트 제외.
- **도입부**: 첫 3~5문장 안에 "이 포스트가 무엇을 다루고, 독자가 무엇을 얻을지"를 모두 밝힌다.
  - **첫 문장 금지 클리셰**: "~는 필수적이다", "~를 살펴본다", "~의 기본이 된다", "~는 빠질 수 없는", "~의 핵심은 ~이다" — 이들 표현으로 첫 문장을 시작하면 안 된다.
  - 프롬프트의 "도입부 5종 템플릿"(역사 일화 / 실패 이야기 / 직관 질문 / 실무 문제 / 반직관 관찰) 중 하나를 선택하되, `{RECENT_POSTS}`에서 최근에 쓰인 템플릿은 피한다.
- **문장**: 짧게. 평균 40자 이하 지향. 접속사("~하며, ~하고")로 묶지 말고 마침표로 자른다.
- **문단**: 한 문단 = 한 주제, **최대 5문장**. 길어지면 섹션(`##`)을 나눈다.
- **기술 용어**: 처음 등장 시 괄호 안에 한 줄 풀이 (예: "Reynolds 수(관성력/점성력 비)").
- **수식**: KaTeX — 인라인 `$...$`, 블록 `$$...$$`. 수식 뒤 한 줄로 각 기호 의미 명시.
  - **멀티라인 블록 수식 규칙**: `$$`는 반드시 **독립 라인**에 위치. 같은 줄에 수식 내용을 쓰면 remark-math 파싱 오류.
    ```
    $$
    \int ... d\Omega \\
    + \oint ... d\Gamma
    $$
    ```
    단일라인은 `$$E = mc^2$$` 형태도 허용.
- **코드 블록**: 언어 명시 필수 (` ```python `, ` ```cpp `, ` ```fortran `). 입력→처리→결과 출력까지 **실제 돌아가는 코드** 작성.
  - **중복 금지**: `{USED_CODE_SIGNATURES}`에 나열된 클래스/함수명과 동일한 이름은 쓰지 않는다. (예: 최근 `class RigidBody`가 있었다면 오늘은 다른 이름 선택)
  - **토이 문제 다양화**: 프롬프트의 토이 문제 풀(8개 이상) 중 **최근 10개 포스트에서 쓰지 않은 것** 우선 선택.
- **인터랙티브 시각화**: 본문에 **1~2개 필수** 삽입 (`_viz_components.txt` 목록만 사용). **0개는 실패 조건 — 재작성한다.**
  - `{USED_VIZ_COMPONENTS}`에 이미 있는 컴포넌트는 피하고, **미사용 / 덜 쓰인 것 우선**.
  - `_viz_components.txt`의 "주제→컴포넌트 매핑 표"를 참고해 **오늘 포스트 주제에 정확히 맞는** 컴포넌트 선택.
  - 삽입 전 1문장 안내: "아래 시뮬레이션에서 직접 조작해보자."
  - 삽입 후 1~2문장 관찰 포인트: "Reynolds를 200까지 올리면 ~"
- **섹션 구조**: `{RECENT_POSTS}`의 최근 10개 포스트와 `##` 섹션 헤딩이 **4개 이상 겹치면 실패**로 간주하고 다른 구조를 선택한다.
  - 프롬프트의 "섹션 구조 5종"(개념→수식→코드→검증 / 문제→원인→해결 / 역사→유도→현대 / Q&A 5문항 / 비교 매트릭스) 중 오늘 하나 선택.
- **결론**: 마지막 섹션은 "핵심 3줄 요약" 또는 "기억할 점"으로 마무리.

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

---

## 다국어(i18n) 시스템 — 번역 워크플로 명세

### 개요
사이트는 **5개 언어**(`ko / en / ja / zh / es`)를 지원한다. URL은 `/{locale}/...` 형태로 라우팅되며, 첫 방문 시 Cloudflare Pages middleware (`functions/_middleware.ts`)가 cookie > Accept-Language > cf-ipcountry 우선순위로 자동 redirect한다.

### 신규 자동 포스트 — 5개 locale 동시 작성 (필수)

매일 자동 생성되는 포스트는 **반드시 5개 locale 모두로 작성**한다. 자세한 지침은 `scripts/prompts/_multilingual.txt` 참고. 핵심:

1. **산출 파일 5개** (모두 동일 slug):
   - `src/content/posts/ko/YYYY-MM-DD-{slug}.mdx` (한국어, primary)
   - `src/content/posts/en/YYYY-MM-DD-{slug}.mdx` (English)
   - `src/content/posts/ja/YYYY-MM-DD-{slug}.mdx` (日本語)
   - `src/content/posts/zh/YYYY-MM-DD-{slug}.mdx` (简体中文)
   - `src/content/posts/es/YYYY-MM-DD-{slug}.mdx` (Español)

2. **수식·코드·post-viz import 구문은 5개 파일 모두 동일**. 코드 주석만 해당 언어로 번역.

3. **post-viz 컴포넌트 (`src/components/post-viz/{slug}/X.tsx`)는 1번만 작성**, 5개 locale 모두 같은 import 사용. UI 텍스트는 영어로 통일.

4. **frontmatter 규칙**:
   - `title`/`description`은 자연스러운 해당 언어로 번역 (직역 금지)
   - `tags`는 모든 locale 공통 (영문 slug)
   - `date`/`draft`는 그대로
   - locale·slug는 폴더 구조에서 자동 추출 (frontmatter에 적어도 무시됨)

5. **language별 스타일 가이드**:
   - en: 미국 표기(color/behavior), 직접·친근한 톤
   - ja: です/ます체
   - zh: 简体(zh-CN), 中性表达
   - es: 중립 스페인어 (LATAM 친화), tú/usted 직접 호칭 회피

6. **금지 클리셰** (도입부 첫 문장 사용 금지):
   - en: "It is essential to...", "Let us examine..."
   - ja: "〜は不可欠である"
   - zh: "...是必不可少的"
   - es: "Es esencial...", "Vamos a ver..."

7. **자체 검증 (7.5단계)는 5개 파일 모두에 동일 적용**:
   - viz import 구문 존재 / 도입부 클리셰 회피 / 섹션 헤딩 4개 이상 겹침 금지

8. **git 커밋 (한 커밋에 5 locale + post-viz + index.yaml)**:
   ```bash
   git add \
     src/content/posts/{ko,en,ja,zh,es}/YYYY-MM-DD-*.mdx \
     src/components/post-viz/YYYY-MM-DD-*/ \
     source-docs/index.yaml
   git commit -m "post: {요일-전체} 자동 생성 [5 locales] - {ko 제목}"
   git push origin main
   ```

### 기존 포스트 일괄 번역 — `scripts/translate-existing-posts.mjs`

`src/content/posts/ko/` 의 기존 포스트를 4개 언어로 일괄 번역하는 스크립트. Anthropic API 호출.

```bash
export ANTHROPIC_API_KEY=sk-ant-...

# 비용·대상 미리 확인
node scripts/translate-existing-posts.mjs --dry-run

# 전체 번역 (이미 있는 파일은 skip)
node scripts/translate-existing-posts.mjs

# 특정 언어만 / 특정 슬러그만 / 강제 덮어쓰기
node scripts/translate-existing-posts.mjs --only en
node scripts/translate-existing-posts.mjs --slug rhie-chow
node scripts/translate-existing-posts.mjs --force
```

- 모델: 환경변수 `ANTHROPIC_MODEL` (기본 `claude-sonnet-4-6`, 비용 약 $7 / 88 호출)
- 수식·코드·import는 그대로 유지, 주석만 번역
- 자세한 사용법은 `scripts/README.md`

### Locale fallback 정책

특정 locale에 해당 슬러그 파일이 없으면 **한국어(ko) 원문을 표시**하고 상단에 안내 배너:

> "이 포스트는 아직 {언어}로 번역되지 않아 한국어 원문을 표시합니다."

이 fallback은 `src/app/[locale]/posts/[slug]/page.tsx`의 `findPost(loc, slug)` 함수에 구현되어 있다. 자동 포스트가 5개 locale 동시 작성을 지키면 이 배너는 보이지 않는다.

### URL·라우팅 구조

```
/                        → middleware가 자동 redirect → /{detected_locale}/
/ko/                     → 한국어 홈
/en/posts/{slug}         → 영어 포스트 (없으면 ko fallback)
/ja/tags/{tag}           → 일본어 태그 페이지
/zh/about                → 중국어 소개
/es/bookmarks            → 스페인어 북마크
/admin                   → 관리자 (locale 무관, 영어 통일)
/preview/{slug}          → 미리보기 (관리자 전용, ko 베이스)
/read?id={dynamicId}     → 동적 포스트 (관리자 전용)
```

### sitemap·RSS·OG image

- `sitemap.xml`은 5 locale × 모든 페이지 자동 생성 (Next.js native)
- `feed-{locale}.xml` / `feed-{locale}.json`: locale별 RSS·JSON Feed
- `feed.xml`: 기본 ko (역호환)
- OpenGraph image (`opengraph-image.tsx`)는 locale 라벨을 포함해 5종 자동 생성

### `src/i18n/{locale}.json` UI 사전

UI 문자열(메뉴/버튼/안내문)은 5개 locale JSON 사전에 키 등록.
컴포넌트에서는 `t(locale, 'nav.posts')` 형태로 사용. 새 UI 텍스트 추가 시 **5개 사전 모두에** 키를 추가해야 한다.

### LanguageSwitcher

헤더 우측 Globe 아이콘 드롭다운으로 사용자가 수동 변경 가능. 선택 시 `locale` 쿠키(1년)에 저장되어 이후 방문에서도 유지된다.

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
  index.yaml              ← 파일별 last_used 날짜만 기록 (매우 단순)
  cfd-technique/          ← 월/수/금 소스 (CFD 기법, 수치해석, 알고리즘)
    FEM/
    LBM/
    cfd/
    code/
    high-order/
    implicit-solver/
    math/
    mesh/
    numerical-analysis/
    ...
  fluid-mechanics/        ← 화/목 소스 (유체역학 이론, 유동 현상)
    turbulence/
    multiphase/
    combustion/
    gas-dynamics/
    heat-transfer/
    ...
  paper-review/           ← 토/일 소스 (논문 리뷰)
    (여기에 논문 정리 .md 파일 추가)
```

**새 소스 문서 추가하는 법:**
해당 주제 폴더에 `.md` 파일을 넣기만 하면 된다. `index.yaml` 수정 불필요.
- CFD 기법 → `source-docs/cfd-technique/` 하위 적절한 폴더에 넣기
- 유체역학 → `source-docs/fluid-mechanics/` 하위에 넣기
- 논문 리뷰 → `source-docs/paper-review/` 에 넣기

`index.yaml`은 포스팅 루틴이 자동으로 갱신하므로 직접 편집할 필요 없다.

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
