# scripts/

블로그 운영용 스크립트 모음.

## translate-existing-posts.mjs

기존 `src/content/posts/ko/*.mdx` 22개를 4개 언어(en, ja, zh, es)로 일괄 번역.

### 준비

```bash
# 1. Anthropic API 키 발급: https://console.anthropic.com/
export ANTHROPIC_API_KEY=sk-ant-...

# 2. (선택) 모델 변경 — 기본은 claude-sonnet-4-6
export ANTHROPIC_MODEL=claude-sonnet-4-6   # 권장 (비용 ~$7)
# export ANTHROPIC_MODEL=claude-haiku-4-5   # 저렴, 품질 낮음 (~$1)
# export ANTHROPIC_MODEL=claude-opus-4-7    # 최고 품질, 비쌈 (~$25)
```

### 실행

```bash
# 비용·대상 미리 확인 (API 호출 없음)
node scripts/translate-existing-posts.mjs --dry-run

# 전체 번역 (22 × 4 = 88 호출, 약 5~10분)
node scripts/translate-existing-posts.mjs

# 특정 언어만
node scripts/translate-existing-posts.mjs --only en
node scripts/translate-existing-posts.mjs --only ja --only zh

# 특정 슬러그만 (파일명 부분 매칭)
node scripts/translate-existing-posts.mjs --slug rhie-chow --slug riemann

# 이미 존재하는 파일도 강제로 다시 번역
node scripts/translate-existing-posts.mjs --force
```

### 동작

- 각 ko 파일을 읽어 frontmatter + 본문을 그대로 Claude에게 보냄
- 4개 locale 각각 개별 호출 (순차, rate limit 회피)
- 응답을 `src/content/posts/{locale}/{filename}.mdx` 에 저장
- 이미 존재하면 skip (idempotent), `--force` 시 덮어씀
- 수식·코드·import 구문은 번역하지 않음 (코드 주석만 번역)
- 각 언어 스타일 가이드 적용:
  - en: American English, 직접 톤
  - ja: です/ます체
  - zh: 简体中文 (zh-CN)
  - es: 중립 스페인어 (LATAM 친화)

### 비용 (Sonnet 기준)

- 22 ko 포스트 × 4 언어 = 88 호출
- 평균 입력 4K + 출력 4.5K 토큰 가정 → **약 $7**
- Haiku 모델은 ~$1, Opus 모델은 ~$25

### 실행 후

```bash
git status               # 새로 생성된 88개 파일 확인
git add src/content/posts/{en,ja,zh,es}/
git commit -m "i18n: 기존 22 포스트 4개 언어 일괄 번역"
git push origin main
```

## generate-rss.mjs

빌드 후(`out/`) 자동 실행되어 locale별 RSS/JSON Feed 생성:
- `out/feed.xml`, `out/feed.json` (ko 기본)
- `out/feed-en.xml`, `out/feed-ja.xml`, `out/feed-zh.xml`, `out/feed-es.xml`

도메인은 `NEXT_PUBLIC_SITE_URL`(또는 `SITE_URL`) 환경변수를 사용하며, 미설정 시 `https://cfdblog.cc`를 기본값으로 사용.

## generate_post.py

API 방식 자동 포스트 생성 스크립트 — 현재 사용 안 함 (Claude Code 예약 작업이 대체).

## prompts/

**폐기됨.** `generate_post.py`(API 파이프라인)용 템플릿이었다. 내용은 전부
`.claude/rules/daily-post.md`로 이관됐고, 파일은 `tests/test_generate.py`가 존재를
확인하므로 스텁만 남겨 뒀다. **읽지 말 것** — 규칙의 단일 출처는 rule 파일이다.

## daily-context.mjs

매일 포스트 루틴의 컨텍스트 수집을 **호출 1번**으로 끝낸다.

```bash
node scripts/daily-context.mjs             # 오늘(KST)
node scripts/daily-context.mjs 2026-08-10  # 날짜 지정
```

출력(50줄 이내): KST 날짜·요일·그룹 / 날짜 중복(`ALREADY_EXISTS`) / 소스 후보 선택
(미사용 우선 → 오래된 순, ALT 4개 포함) / 최근 10개 포스트의 제목·태그·`##` 섹션·viz
이름·코드 시그니처·도입부 + `USED_VIZ`·`USED_SIGS` 집합.

이 스크립트가 생기기 전에는 같은 정보를 bash 8~10회 왕복으로 캤고, 중간 산출물
(파일 목록 136줄 등)이 그대로 컨텍스트에 쌓였다.

## verify-post-set.mjs

5개 locale 포스트 세트를 ko 기준으로 대조 검증. push 전 게이트.

```bash
node scripts/verify-post-set.mjs 2026-08-10-amr-tagging-and-refluxing
node scripts/verify-post-set.mjs <slug> --run   # python 코드블록 실제 실행 + ko와 출력 대조
```

검사 항목: 5 locale 존재 / 블록 수식 일치 / 코드펜스 언어 일치 / ` ```text ` 출력 블록 일치 /
import 구문 일치 / viz 태그 일치·0개 아님 / `##` 개수 일치 / tags·date·slug·locale·`draft:false` /
CRLF / post-viz `.tsx` 실재 여부. 실패 시 exit 1.

번역 Worker에게 각자 검증 스크립트를 짜게 하면 그 비용이 locale 수만큼 곱해진다. 검증은 여기서 한 번만.
