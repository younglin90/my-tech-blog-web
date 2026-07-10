# CFD.Lab — Change History (archive)
> Moved out of CLAUDE.md to keep the guide lean. Historical record only.

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
