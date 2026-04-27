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

Claude Code 자동 포스트 생성에 사용되는 프롬프트.

- `cfd_technique.txt` — 월/수/금 (CFD 기법)
- `fluid_mechanics.txt` — 화/목 (유체역학 이론)
- `paper_review.txt` — 토/일 (논문 리뷰)
- `_viz_components.txt` — 시각화 컴포넌트 가이드 (모든 프롬프트에서 참조)
- `_multilingual.txt` — 5개 locale 동시 작성 지침 (모든 프롬프트에서 참조)

자세한 동작은 `CLAUDE.md` 참고.
