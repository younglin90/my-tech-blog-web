# 월 10만 원 수익화 운영안

## 현재 기준

2026-09-15 production 통계는 전날 127 pageviews, 누적 9,045 pageviews였다. 전날 수준이
한 달 유지되면 약 3,800 pageviews다. Search Console 자연 검색 클릭은 최근 집계에서 11회였다.
AdSense 게시자 코드와 `ads.txt`는 production에 연결됐고 사이트 리뷰는 `준비 중`이다. Google CMP의
동의/거부/옵션 관리 메시지도 게시했다. Buy Me a Coffee 후원은
`https://buymeacoffee.com/younglin90j`에 연결했고, Buttondown 뉴스레터는 실제 수신 링크가 없어 아직
비활성이다.

광고 수익은 실제 AdSense Page RPM으로 계산한다.

```text
월 광고 수익 = 월 pageviews / 1,000 × Page RPM
목표 pageviews = 100,000원 / Page RPM × 1,000
```

| 실제 Page RPM | 월 10만 원에 필요한 pageviews |
|---:|---:|
| 3,000원 | 33,334 |
| 7,000원 | 14,286 |
| 12,000원 | 8,334 |

RPM은 국가·주제·광고 수요에 따라 크게 달라지므로 위 값은 예측이 아니라 역산표다. 현재 트래픽만으로
광고에 전부 의존하지 말고, `CFD 프로젝트 검토 1건 × 100,000원`을 함께 운영하는 것이 가장 짧은 경로다.

## production에서 켤 값

Cloudflare Pages의 production 환경변수에 다음을 등록하고 재배포한다. 값은
`.env.local.example`의 형식을 따른다.

1. `NEXT_PUBLIC_ADSENSE_CLIENT`: 현재 기본값 `ca-pub-8224726790382223`; 다른 계정일 때만 덮어쓴다.
2. `NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE`: Display ad unit ID. Auto ads만 쓸 때는 생략 가능
3. `NEXT_PUBLIC_CFD_REVIEW_URL`: 실제 문의를 받을 폼·예약 페이지·메일 주소
4. `NEXT_PUBLIC_CFD_REVIEW_PRICE_KRW=100000`: CTA에 표시할 시작 가격
5. `NEXT_PUBLIC_BUTTONDOWN_USERNAME`: 재방문 독자를 쌓을 뉴스레터 계정
6. `NEXT_PUBLIC_SUPPORT_URL`: 기본 Buy Me a Coffee 주소를 다른 공개 후원 페이지로 덮어쓸 때 사용
7. `NEXT_PUBLIC_SUPPORT_COFFEE_URL`, `NEXT_PUBLIC_SUPPORT_BEER_URL`: 금액별 링크가 있을 때만 선택적으로 설정

설정 검사는 다음 명령으로 한다.

```bash
npm run monetization:check
npm run monetization:check -- --strict
```

AdSense 자동광고는 퍼블리셔 ID만 있으면 사이트 전체의 로더가 켜진다. 수동 광고를 함께 쓸 때는
본문이 끝난 직후에만 표시해 글의 인터랙티브 도구와 광고가 섞이지 않게 했다. `ads.txt`는 production
빌드 중 퍼블리셔 ID로 자동 생성된다.

후원 모듈은 실제 `https` 후원 링크가 하나라도 있을 때만 렌더된다. 커피(약 5천 원)와 맥주(약 1만 원)를
각각 선택하고 `support-click` 이벤트의 `tier`, `amount`, `source`, `locale`로 전환을 비교한다. 공통 링크만
설정하면 두 선택지가 같은 결제 페이지를 열고, 금액별 링크를 지원하는 서비스라면 별도 URL로 결제 단계를
줄일 수 있다. 카드번호·계좌 비밀번호 같은 비밀 정보는 환경변수에 넣지 않는다.

## 매주 볼 숫자

- Search Console: 검색 클릭, 색인된 페이지, `크롤링됨 - 현재 색인 미생성`
- 사이트 통계(D1): 일별 방문자, 글별 조회수·👍/👎 (`/api/visitors`, `/api/top-posts`, `/api/post-stats`)
- AdSense: Page RPM, viewable impressions, 국가별 수익
- 전환: 프로젝트 검토 문의 수와 실제 결제 수

첫 4주는 광고 수익보다 검색 유입과 문의 전환을 본다. CTA가 붙은 글의 조회수는 느는데 문의가 없으면
폼을 짧게 만들고, 클릭 자체가 없으면 CTA 문구보다 상위 유입 글과 도구 페이지의 검색 의도를 먼저
개선한다.

## 8주 실행 순서

1. 1주차: AdSense 심사·Auto ads를 완료하고 실제 후원 링크를 production에 연결한다. CMP와 5개 언어
   개인정보·쿠키 안내는 완료됐다. CFD 검토 문의 폼은 Google Form 준비 후 연결한다.
2. 2주차: 홈의 3개 `START HERE` 경로와 상위 글의 관련/이전·다음 링크 CTR을 비교한다. 클릭이 낮은
   경로는 제목을 바꾸기 전에 유입 검색어와 첫 화면 설명이 일치하는지 확인한다.
3. 3~4주차: `FDM vs FEM vs FVM`, Plateau–Rayleigh, Darcy–Forchheimer처럼 이미 조회되는 주제의
   제목·도입부·예제 코드를 보강한다. 새 주제를 넓게 늘리는 것보다 기존 검색 노출을 클릭으로 바꾼다.
4. 5~6주차: GCI, y+, CFL, normal shock처럼 계산 의도가 분명한 도구에 설명·검증 예제·관련 글을
   추가한다. 도구 조작부 주위에는 수동 광고를 두지 않는다.
5. 7~8주차: 실제 AdSense Page RPM과 문의 전환율로 목표 경로를 다시 계산한다. 광고가 목표의 절반에
   못 미치면 페이지 광고 수를 늘리지 말고 CFD 검토 사례와 문의 흐름을 먼저 개선한다.

## 정책 안전선

- 광고 클릭을 요청하거나 후원 문구를 광고 가까이에 두지 않는다.
- 인터랙티브 계산기 조작부 주변에는 수동 광고를 두지 않는다.
- AdSense에서 Auto ads를 켤 때 `/tools/` 화면의 배치를 미리 보고 필요하면 제외 영역을 지정한다.
- EEA·영국 등 동의가 필요한 방문자에 대해서는 AdSense의 Google 인증 CMP 메시지를 설정한다.
- 광고와 후원은 시각·문구로 분리하고, 광고 클릭을 후원이나 콘텐츠 이용 조건처럼 표현하지 않는다.

공식 문서:

- https://support.google.com/adsense/answer/9274019
- https://support.google.com/adsense/answer/9261307
- https://support.google.com/adsense/answer/48182
