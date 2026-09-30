---
description: Daily CFD blog post routine — source selection, writing rules, 5-locale output, verification
paths:
  - "src/content/posts/**"
  - "source-docs/**"
  - "src/components/post-viz/**"
---

# 매일 포스트 루틴

트리거: "오늘 포스트 만들어줘" / `/daily-post` / 예약작업 `cfd-daily-post`(월~금 10:05).
목표: 오늘 날짜로 포스트 1개를 **5개 locale 동시** 작성 → `main`에 push (Cloudflare 자동 배포).

**이 파일 하나로 충분하다.** `scripts/prompts/*.txt`는 폐기된 API 파이프라인 잔재 — 읽지 말 것.
탐색·검증은 아래 스크립트로만. ad-hoc bash 왕복으로 같은 정보를 다시 캐지 않는다.

## 0. 브랜치
이 루틴은 `main`에서 직접 작업·push할 권한이 있다. 자동 생성된 `claude/...` 브랜치는 무시.
```bash
git fetch origin main && git checkout main && git pull --ff-only origin main
```

## 1. 컨텍스트 수집 — 호출 1번
```bash
node scripts/daily-context.mjs
```
KST 날짜·요일·그룹, 날짜 중복 체크, 소스 후보 선택(미사용 우선 → 오래된 순), 최근 10개 포스트의
제목·태그·`##` 섹션·viz 이름·코드 시그니처·도입부, 기존 태그 목록, 주제 중복 점수를 한 번에 출력한다.
**이 출력이 유일한 탐색 결과다. 여기 있는 정보를 bash·grep으로 다시 캐지 말 것.**
- `ALREADY_EXISTS` → "이미 있음" 한 줄 출력 후 종료.
- `SKIP` → 해당 사유 출력 후 종료.
- 요일→그룹: 월수금 `cfd-technique` / 화목 `fluid-mechanics` / 토일 `paper-review`.
- `PICK_OVERLAP`에 **2점 이상**이 뜨면 그 글 제목을 보고 판단한다. 같은 소재면 ALT로 이동
  (`ALT_OVERLAP`에서 점수가 낮은 것부터). 최대 3회. 이 판정에 추가 grep은 필요 없다.
- `EXISTING_TAGS`가 태그 재사용 목록이다. 새 태그는 여기 없는 것만, 포스트당 최대 2개.
- `DEPS`가 `없음`이면 `npm ci`를 **지금** 돌린다. 6단계에서 발견하면 빌드 한 사이클을 버린다.
- 금요일 예외: `source-docs/qa-log.md`가 있고 미처리 질문 항목이 있으면 그것을 우선 소재로 쓴다.
  (파일이 없으면 이 조항은 스킵 — 현재 없음.)

## 2. 소스 읽기
- 200줄 이하 → 전체. 초과 → `grep -n '^#'`로 헤딩 목록만 먼저 뽑고, 쓸 섹션 1~2개만 범위로 읽는다
  (총 300줄 이내). 큰 파일을 앞에서부터 통째로 읽지 말 것.
- 1단계 출력의 `이미 읽은 섹션(제외할 것)`에 적힌 섹션은 건너뛴다. `index.yaml`을 열 필요 없다.
- 실제로 읽은 섹션 제목은 7단계 기록용으로 보관.

## 3. post-viz 컴포넌트 (1~2개, 필수)
`src/components/post-viz/{DATE}-{slug}/{ComponentName}.tsx`에 **매번 새로 작성**한다.

목표는 정확한 시뮬레이션이 아니라 **독자가 개념을 이해하게 돕는 조작형 동적 애니메이션**이다.
근사·과장·단순화해도 좋다. 핵심 메시지가 눈에 보이는 것이 우선.

- 실패 조건(재작성): viz 0개 / 못 만지는 정지 그림·자동 루프 / 슬라이더가 값만 바꾸고 화면은 그대로 /
  본문 수식·현상과 1:1로 연결되지 않는 범용 데모.
- 첫 줄 `'use client'`. 외부 라이브러리 금지 (react + Canvas/SVG + `@/lib/*`만).
- `useState` + 슬라이더/버튼/토글로 조작 UI 필수. `requestAnimationFrame` + useEffect cleanup, 60fps.
- 축·범례·단위·현재값·상태별 색을 넣어 설명 없이도 조작·관찰 포인트가 드러나게.
- React state를 매 프레임 갱신하지 말 것(리렌더 폭주). 캔버스에 그리고 state는 10~15프레임마다.
- 이름은 PascalCase + 주제 반영 + 전역 유일. `USED_VIZ`에 있는 이름 재사용 금지.
- 격자 100 이하 권장. 무거운 3D/WebGL 지양.
- fallback(주제가 정확히 맞고 custom 비용이 과할 때만): `BoundaryCondition type=` /
  `NumericalScheme scheme= order=` / `PressureContour levels= colormap=` / `NumericalDungeon` /
  `MachArchitect` / `StreamLine particles= speed= obstacle=` / `VelocityField reynolds= animated= gridSize=`.
  존재하지 않는 prop을 쓰면 빌드가 깨진다.

## 4. MDX 5개 작성
`src/content/posts/{ko,en,ja,zh,es}/{DATE}-{영문-slug}.mdx` — 같은 slug, 같은 date, 같은 섹션 구조.
post-viz는 1번만 작성하고 5개 파일이 같은 import 경로를 공유한다. viz 내부 UI 문자열은 영어로 통일.

```yaml
---
title: "구체적·검색 친화적 제목"
date: YYYY-MM-DD
description: "한 문장 요약 (50자 이내)"
tags: ["구체태그", "...", "..."]   # 3~5개, 5 locale 공통(영문), 첫 태그가 가장 구체적
locale: ko                          # 파일별 ko/en/ja/zh/es
slug: {DATE}-{공통 영문 slug}       # 파일명과 완전히 동일. 날짜 접두사 필수
takeaway: "이 글의 답 한 문장"       # description과 다른 문장. 본문 상단에 노출된다.
draft: false                        # 항상 false
---
```
`description`은 검색 결과 스니펫이다. 짧게 쓰면 빌드가 본문 첫 문장을 이어 붙여 채우지만
(contentlayer `seoDescription`), 직접 쓴 문장이 항상 낫다. ko/ja/zh는 60~80자,
en/es는 120~155자를 목표로. `takeaway`는 스니펫이 아니라 독자가 처음 보는 한 문장이다.
frontmatter 바로 아래 `import { X } from '@/components/post-viz/{DATE}-{slug}/X'`.

**태그**: "CFD"는 진짜 일반론일 때만. FVM/FEM/DGM/LBM/IBM/Riemann/TVD/WENO/SIMPLE/Multigrid/AMR/
Krylov/Multiphase/Turbulence/Combustion/Heat-Transfer/Compressible/Incompressible/OpenFOAM 등 우선.
- **ASCII 영문 하이픈만.** 한글·공백 금지 (`논문리뷰` ✗ → `Paper-Review` ✓). 5 locale 동일.
- **새 태그는 포스트당 최대 2개.** 나머지는 기존 태그를 재사용한다. 이 상한이 없으면
  포스트 1개짜리 태그가 계속 쌓인다 — 그런 태그 페이지는 색인에서 제외된다
  (`src/lib/tags.ts`의 `TAG_INDEX_MIN`). 기존 태그 목록은 `daily-context.mjs`가 출력한다.
- 대소문자도 URL을 가른다. 기존 태그와 철자·대소문자를 정확히 맞출 것.

### 글 규칙
- 분량 4~7분: 한국어 1,000~1,700단어(공백 제외 2,500~4,500자). 코드·수식 제외.
- 문장 평균 40자 이하. 접속사로 잇지 말고 마침표로 자른다. 한 문단 = 한 주제, 최대 5문장.
- 기술 용어는 첫 등장 시 괄호로 한 줄 풀이.
- 도입부: 첫 3~5문장 안에 "무엇을 다루고 독자가 무엇을 얻는지". 템플릿 5종 중
  최근에 안 쓴 것 — 역사 일화 / 실패 이야기 / 직관 질문 / 실무 문제 / 반직관 관찰.
- 첫 문장 금지 클리셰 — ko: "~는 필수적이다", "~를 살펴본다", "~의 기본이 된다", "~는 빠질 수 없는",
  "~의 핵심은 ~이다" · en: "It is essential to", "Let us examine", "It is well-known that" ·
  ja: 「〜は不可欠である」「〜について見てみよう」 · zh: "...是必不可少的", "让我们来看看..." ·
  es: "Es esencial...", "Vamos a ver...".
- 섹션 구조 5종 중 최근에 안 쓴 것 — 개념→수식→코드→검증 / 문제→원인→해결 / 역사→유도→현대 /
  Q&A 5문항 / 비교 매트릭스. 최근 10개와 `##` 헤딩이 4개 이상 겹치면 실패.
- 마지막 섹션 헤딩은 매번 다르게. "핵심 3줄 요약"·"기억할 점"·"실무 체크리스트"는 과다 사용 — 금지.
- 수식: 인라인 `$...$`, 블록 `$$...$$`. **멀티라인 `$$`는 단독 줄에서 시작·종료** (같은 줄에 내용을
  쓰면 이후 모든 수식이 깨진다). 단일라인 `$$E=mc^2$$`는 허용. 수식 뒤 한 줄로 각 기호 설명.
- 코드: 언어 명시 필수. 입력→반복→결과 출력까지 **실제로 돌아가는 코드**. 돌려서 나온 출력을
  ` ```text ` 블록에 그대로 싣는다(지어내지 말 것). `USED_SIGS`에 있는 함수·클래스명 재사용 금지.
- 토이 문제는 최근에 안 쓴 것 우선: 1D Burgers / 2D vorticity-streamfunction / Taylor–Green /
  Kelvin–Helmholtz / Rayleigh–Taylor / Shu–Osher / Double Mach reflection / Karman street /
  Hagen–Poiseuille 진입영역 / Couette / Rayleigh–Bénard / BFS / 2D Riemann.
- viz 삽입 직전 1문장 안내("아래 시뮬레이션에서 직접 조작해보자"), 직후 1~2문장 관찰 포인트
  (무엇을 조작하고 무엇을 관찰하는지).
- **첫 viz는 본문 앞 1/4 안에.** 뒤쪽에만 있으면 대부분의 방문자는 보지 못하고 이탈한다.
- **본문 내부 링크 2개 이상 필수.** 형식은 `[텍스트](/{그 파일의 locale}/posts/{DATE}-{slug}/)` —
  **URL slug에는 날짜 접두사가 들어간다**(`/ko/posts/2026-09-28-lbm-half-step-viscosity.../`).
  날짜를 빼면 빌드 마지막의 `check-internal-links`가 5 locale × 링크 수만큼 깨진 링크로 잡는다 —
  `verify-post-set.mjs`는 이걸 못 잡으므로 빌드 한 사이클을 그대로 버린다.
  locale 세그먼트와 끝 슬래시를 모두 붙인다. ja 파일은 `/ja/posts/...`로 쓴다(ko URL 복사 금지).
  연결할 글 후보는 `daily-context.mjs`가 출력한다.

### locale별 문체
직역 금지, 각 언어 모국어 화자에게 자연스럽게. 수식·코드·import는 5개 파일 동일, **코드 주석만 번역**.
분량은 ko 대비 ±20%. en 미국 표기(color/behavior)·직접적 톤 / ja です・ます체 /
zh 간체(zh-CN)·중립 / es 중립 LATAM·tú·usted 회피(비인칭).

**subagent 금지.** 4개 언어를 Worker에 맡기면 ko 본문·코드·수식이 Worker마다 다시 컨텍스트로
올라가고, 완료 보고와 재검증까지 붙어서 직접 쓰는 것보다 토큰이 많이 든다. 5개 locale을 직접 쓴다.
ko를 먼저 완성한 뒤 en → ja → zh → es 순으로 이어 쓰면 ko 본문이 컨텍스트에 한 번만 올라간다.
frontmatter·본문만 새로 쓰고, import·수식·코드블록·출력블록은 ko에서 그대로 복사한다.

## 5. 인덱스 갱신
`source-docs/index.yaml`의 `last_used[{상대경로}]`에 append (기존 문자열 값은 목록으로 정규화):
```yaml
  "{상대경로}":
    - date: "YYYY-MM-DD"
      sections: ["오늘 읽은 섹션1", "..."]
```

## 6. 검증 — push 전 게이트
```bash
node scripts/verify-post-set.mjs {DATE}-{slug} --run   # 5 locale 정합 + 코드블록 실제 실행
npm run build 2>&1 | tail -20                          # KaTeX/MDX/TS 에러 0이어야 함
```
둘 다 통과해야 push. 실패하면 고치고 재실행. **깨진 상태로 main push 절대 금지.**

## 7. 커밋 & 푸시
```bash
git add src/content/posts/{ko,en,ja,zh,es}/{DATE}-*.mdx src/components/post-viz/{DATE}-*/ \
        source-docs/index.yaml src/lib/*.json src/lib/viz-registry.tsx public/*-index.json
git commit -m "post: {요일} 자동 생성 [5 locales] - {ko 제목}"
git push origin main
```

## 8. 보고 (3~5줄)
5개 파일 경로 + ko 제목 + viz 경로 + 검증 결과(스크립트 출력 근거).

## 실패 처리
```
FAILED at Step N: {단계}
이유: {한 줄}
현재 상태: {파일 저장/커밋 여부}
권고: {다음 조치}
```
작성된 MDX·tsx가 있으면 지우지 말고 경로만 알린다.

## 토큰 예산 — 이 루틴의 목표는 "한 번에 통과"다
1회 실행의 tool 호출 상한 대략: 컨텍스트 1, 소스 읽기 1~2, viz 작성 1~2, MDX 작성 5,
index.yaml 1, 검증 2(verify + build), 커밋·푸시 2. **총 15회 안쪽.**
- 같은 파일을 두 번 읽지 않는다. Edit 후 확인차 Read 금지 — 실패했으면 Edit이 에러를 냈다.
- `ls`·`find`·`grep`으로 저장소를 둘러보지 않는다. 경로는 이 문서와 1단계 출력에 다 있다.
- 파이썬 실험은 스크래치 파일에 쓰고 **한 번** 돌린다. 출력이 마음에 안 들면 고쳐서 다시 한 번.
  포스트에 실을 코드는 런타임 40초 이내로 맞춘다(검증에서 5회 재실행된다).
- 빌드 로그는 `| tail -20`으로만 본다. 전체를 흘리지 않는다.
- 실패해도 처음부터 다시 하지 않는다. 실패한 단계만 고친다.

## 절대 금지
`draft: true` / main 외 브랜치 push·PR·`--force`·`--no-verify` / 빌드 실패 상태 push /
subagent·Task 위임 / 1단계 출력에 이미 있는 정보를 bash로 재조회 /
import만 넣고 post-viz 파일 없음 / 상호작용 없는 viz / post-viz에 새 npm 패키지 /
하드코딩 날짜 / `source-docs/` 밖의 개인 자료 / ko 1개만 만들고 종료 /
비ASCII·공백 태그 / locale 세그먼트 없는 본문 링크 / 본문 내부 링크 0개 /
날짜 접두사 없는 `slug:`·본문 링크.
