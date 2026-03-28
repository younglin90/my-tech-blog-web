# CFD.Lab 자율 개선 목표

## 개선 대상
- UI/UX 전체 (디자인, 애니메이션, 접근성, 모바일)
- SEO / 성능 (메타태그, OG 이미지, Core Web Vitals)
- 기능 추가 (목차, 댓글, 뉴스레터, 검색 고도화 등)
- 코드 품질 (타입 안전성, 컴포넌트 리팩토링, 테스트)

## 완료 조건
사용자가 "STOP" 또는 "멈춰"라고 할 때까지 무한 반복.
각 이터레이션 후 반드시 `npm run build` 성공 확인.

## 반복 규칙
1. CLAUDE.md와 DESIGN.md를 먼저 읽어 컨텍스트 파악
2. 개선 아이디어 선택 → 구현 → `npm run build` 검증
3. 빌드 성공 시: git add + commit + push
4. 빌드 실패 시: 에러 수정 후 재시도 (같은 접근법 2회 실패 시 포기하고 다음 아이디어로)
5. 각 이터레이션은 하나의 집중된 개선 단위로 유지
6. PROGRESS.md에 완료한 작업 목록을 누적 기록

## 금지 사항
- 파괴적 작업 (파일 삭제, DB 드롭 등) 금지
- `.env.local` 수정 금지
- `draft: false` 포스트 수정 금지
- 이미 구현된 기능 중복 구현 금지 (CLAUDE.md 참조)

## 빌드 검증 명령어
cd /d D:\work\claude_code\my-tech-blog-web && npm run build
