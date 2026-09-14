// 수익화 설정 — 전부 환경변수로 켜고 끈다.
//
// 값이 비어 있으면 해당 UI는 아예 렌더되지 않는다(빈 박스도 안 남는다).
// 그래서 이 파일을 머지해도 환경변수를 넣기 전까지 사이트 화면은 그대로다.
//
// Cloudflare Pages → Settings → Environment variables 에 넣을 값:
//
//   NEXT_PUBLIC_SUPPORT_GITHUB_SPONSORS   github 계정명 (GitHub Sponsors 가입 후)
//   NEXT_PUBLIC_SUPPORT_BMC               buymeacoffee.com 핸들
//   NEXT_PUBLIC_SUPPORT_TOSS              토스 송금 링크 전체 URL
//   NEXT_PUBLIC_ADSENSE_CLIENT            ca-pub-XXXXXXXXXXXXXXXX
//   NEXT_PUBLIC_ADSENSE_SLOT              본문 하단 광고 단위 ID (숫자)
//
// NEXT_PUBLIC_* 는 빌드 시점에 번들에 박히는 공개 값이다. 비밀 값을 넣지 말 것.

export const SUPPORT = {
  githubSponsors: process.env.NEXT_PUBLIC_SUPPORT_GITHUB_SPONSORS ?? '',
  buyMeACoffee: process.env.NEXT_PUBLIC_SUPPORT_BMC ?? '',
  toss: process.env.NEXT_PUBLIC_SUPPORT_TOSS ?? '',
} as const

export const hasSupport =
  Boolean(SUPPORT.githubSponsors) || Boolean(SUPPORT.buyMeACoffee) || Boolean(SUPPORT.toss)

export const ADSENSE = {
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? '',
  slot: process.env.NEXT_PUBLIC_ADSENSE_SLOT ?? '',
} as const

export const hasAds = Boolean(ADSENSE.client) && Boolean(ADSENSE.slot)
