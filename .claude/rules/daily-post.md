---
description: Daily CFD blog post generation routine, source selection, and writing rules (글 규칙)
paths:
  - "src/content/posts/**"
  - "source-docs/**"
  - "scripts/prompts/**"
  - "src/components/post-viz/**"
---

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
     - `paper-review/`는 현재 60개 이상의 논문 요약 파일이 있으므로 토·일 포스팅이 정상 동작한다.

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
