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
//   NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE      글 본문 직후 광고 단위 ID (숫자)
//   NEXT_PUBLIC_ADSENSE_SLOT              위 값의 레거시 폴백
//   NEXT_PUBLIC_CFD_REVIEW_URL             유료 CFD 검토 문의/예약 URL
//   NEXT_PUBLIC_CFD_REVIEW_PRICE_KRW       시작 가격(원, 선택)
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
  articleSlot:
    process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE ??
    process.env.NEXT_PUBLIC_ADSENSE_SLOT ??
    '',
} as const

// Auto ads는 client만 있으면 동작한다. 수동 광고 단위는 client + slot이 모두 필요하다.
export const hasAutoAds = Boolean(ADSENSE.client)
export const hasArticleAd = hasAutoAds && Boolean(ADSENSE.articleSlot)

export const CFD_REVIEW = {
  url: process.env.NEXT_PUBLIC_CFD_REVIEW_URL ?? '',
  priceKrw: process.env.NEXT_PUBLIC_CFD_REVIEW_PRICE_KRW ?? '',
} as const

function isAllowedPublicUrl(value: string): boolean {
  if (!value) return false
  try {
    return ['https:', 'mailto:'].includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export const hasCfdReview = isAllowedPublicUrl(CFD_REVIEW.url)
