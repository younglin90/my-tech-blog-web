# CFD.Lab — Claude Code 가이드

CFD 연구자의 기술 블로그. Claude Code가 매일 소스 문서 1개를 읽고 5-locale MDX 포스트를
써서 `main`에 push → Cloudflare Pages 자동 배포. (구 Actions + API 파이프라인은 폐기)

**답변은 한국어. 짧게, 주장 대신 diff·실행 출력으로.**

## 작업 전 읽을 파일 — 해당될 때만, 아니면 읽지 말 것
| 작업 | 파일 |
|---|---|
| 매일 포스트 (`/daily-post`, "오늘 포스트", 예약작업 `cfd-daily-post`) | `.claude/rules/daily-post.md` — **이것 하나면 충분** |
| 사이트 코드 경로·명령어 | `.claude/project-map.md` |
| UI·디자인 | `DESIGN.md` + `.claude/rules/design-system.md` |
| 새 프론트엔드 화면 | `.claude/rules/frontend-aesthetics.md` |

## 작업 방식
- 정보가 모이면 바로 실행. 이미 정해진 것을 다시 묻지 않는다(사용자는 실행 중 답할 수 없음).
- 필요한 만큼만. 추측성 리팩터·방어 코드·호환 shim 금지.
- 토큰은 비용이다. 파일은 필요한 부분만 읽고, 탐색·검증은 전용 스크립트 한 번으로 끝낸다.
- subagent는 병렬 이득이 확실할 때만. 완료 보고를 믿지 말고 diff·테스트로 직접 확인한다.

## 손대지 말 것 (빌드 생성물)
`src/lib/{post-index,rag-index,glossary,summaries,math-manifest,viz-manifest}.json`,
`src/lib/viz-registry.tsx`, `public/*-index.json`, `out/`, `source-docs/index.yaml`(루틴이 갱신)

## 함정
- LF 고정(`.gitattributes`). CRLF 커밋 금지 — 빌드 깨짐.
- 블록 수식 `$$`는 단독 줄. 같은 줄에 내용을 쓰면 remark-math 파싱 실패.
- 포스트는 viz ≥ 1개, 5 locale 동시, `draft: false`.
