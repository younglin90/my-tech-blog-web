// 수익화 설정 — 전부 환경변수로 켜고 끈다.
//
// 값이 비어 있으면 해당 UI는 아예 렌더되지 않는다(빈 박스도 안 남는다).
// 그래서 이 파일을 머지해도 환경변수를 넣기 전까지 사이트 화면은 그대로다.
//
// Cloudflare Pages → Settings → Environment variables 에 넣을 값:
//
//   NEXT_PUBLIC_SUPPORT_URL               공통 후원 페이지 전체 URL
//   NEXT_PUBLIC_SUPPORT_COFFEE_URL        커피 선택용 결제/후원 URL (선택)
//   NEXT_PUBLIC_SUPPORT_BEER_URL          맥주 선택용 결제/후원 URL (선택)
//   NEXT_PUBLIC_SUPPORT_GITHUB_SPONSORS   github 계정명 (GitHub Sponsors 가입 후)
//   NEXT_PUBLIC_SUPPORT_BMC               buymeacoffee.com 핸들 (레거시 폴백)
//   NEXT_PUBLIC_SUPPORT_TOSS              토스 송금 링크 전체 URL (레거시 폴백)
//   NEXT_PUBLIC_ADSENSE_CLIENT            ca-pub-XXXXXXXXXXXXXXXX
//   NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE      글 본문 직후 광고 단위 ID (숫자)
//   NEXT_PUBLIC_ADSENSE_SLOT              위 값의 레거시 폴백
//   NEXT_PUBLIC_CFD_REVIEW_URL             유료 CFD 검토 문의/예약 URL
//   NEXT_PUBLIC_CFD_REVIEW_PRICE_KRW       시작 가격(원, 선택)
//
// NEXT_PUBLIC_* 는 빌드 시점에 번들에 박히는 공개 값이다. 비밀 값을 넣지 말 것.

// AdSense 게시자 ID는 광고 코드와 ads.txt에 공개되는 값이다. 환경변수가 없더라도
// 현재 소유자의 계정을 사용해 사이트 소유권 확인과 Auto ads가 동작하게 한다.
const DEFAULT_ADSENSE_CLIENT = 'ca-pub-8224726790382223'

function httpsUrl(value: string | undefined): string {
  if (!value) return ''
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' ? parsed.toString() : ''
  } catch {
    return ''
  }
}

const githubSponsors = (process.env.NEXT_PUBLIC_SUPPORT_GITHUB_SPONSORS ?? '').trim()
const buyMeACoffee = (process.env.NEXT_PUBLIC_SUPPORT_BMC ?? '').trim()
const legacyUrl = httpsUrl(
  process.env.NEXT_PUBLIC_SUPPORT_TOSS ||
    (buyMeACoffee ? `https://buymeacoffee.com/${buyMeACoffee}` : '') ||
    (githubSponsors ? `https://github.com/sponsors/${githubSponsors}` : ''),
)
const commonUrl = httpsUrl(process.env.NEXT_PUBLIC_SUPPORT_URL) || legacyUrl

export const SUPPORT = {
  coffeeUrl: httpsUrl(process.env.NEXT_PUBLIC_SUPPORT_COFFEE_URL) || commonUrl,
  beerUrl: httpsUrl(process.env.NEXT_PUBLIC_SUPPORT_BEER_URL) || commonUrl,
  sponsorUrl: githubSponsors ? `https://github.com/sponsors/${githubSponsors}` : '',
} as const

export const hasSupport = Boolean(SUPPORT.coffeeUrl || SUPPORT.beerUrl || SUPPORT.sponsorUrl)

export const ADSENSE = {
  client: process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? DEFAULT_ADSENSE_CLIENT,
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
