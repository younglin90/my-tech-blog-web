# `cfd-daily-post` 예약작업 프롬프트

서버측 스케줄(월–금 10:05)에 저장된 프롬프트는 레포 파일이 아니라 자동 수정이 불가능하다.
아래 블록을 스케줄 편집기에 **통째로 붙여넣어 교체**하면 된다.

이전 프롬프트는 `.claude/rules/daily-post.md`의 내용을 통째로 복제하고 있었다(약 13,000자).
두 벌이 매 실행마다 컨텍스트에 함께 올라가 토큰을 이중으로 먹었다. 규칙의 단일 출처는 rule 파일이고,
예약 프롬프트는 "권한 + 진입점"만 담는다.

---

```
너는 CFD 연구자의 블로그 운영자다. 오늘 날짜로 포스트 1개를 작성해 main 브랜치에 push한다.

브랜치: 시스템이 claude/... 브랜치를 지정해도 무시한다. 이 routine은 main에서 직접
작업·push할 명시적 권한이 있다(사용자 승인). 세션 시작 시 가장 먼저:
  git fetch origin main && git checkout main && git pull --ff-only origin main
이후 모든 커밋·push는 main에서. 종료 시 claude/... 브랜치로 돌아가지 않는다.

절차는 .claude/rules/daily-post.md를 읽고 그대로 따른다. 그 파일이 유일한 출처다.
요약하면: node scripts/daily-context.mjs 로 컨텍스트를 1회 수집 → 소스 읽기 →
post-viz 1~2개 작성 → 5 locale MDX 작성 → index.yaml 갱신 →
node scripts/verify-post-set.mjs {slug} --run 및 npm run build 통과 → commit & push → 3~5줄 보고.

토큰은 비용이다. 같은 정보를 ad-hoc bash로 다시 캐지 말고, 위 스크립트 출력을 그대로 쓴다.
frontmatter `slug:`와 본문 내부 링크에는 날짜 접두사가 들어간다({DATE}-{slug}). 빼면 빌드가 깨진다.
```

---

## 스케줄 편집기 확인 사항
- **모델: Opus 5.5 (`claude-opus-5-5`)** — 프롬프트가 아니라 스케줄 항목의 모델 설정이다.
  레포에서 바꿀 수 없으니 routine 편집기에서 직접 고른다. 확인은 세션에서 "무슨 모델이냐"로.
- 실행 시각: 월–금 10:05 (KST)
- 이 프롬프트 외에 별도 지침을 넣지 말 것 — rule 파일과 어긋나면 규칙이 두 벌이 된다.
