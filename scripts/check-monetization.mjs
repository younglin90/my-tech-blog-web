#!/usr/bin/env node

const env = process.env
const strict = process.argv.includes('--strict')

const client =
  env.NEXT_PUBLIC_ADSENSE_CLIENT ?? 'ca-pub-8224726790382223'
const articleSlot =
  env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE ?? env.NEXT_PUBLIC_ADSENSE_SLOT ?? ''
const reviewUrl = env.NEXT_PUBLIC_CFD_REVIEW_URL ?? ''
const reviewPrice = env.NEXT_PUBLIC_CFD_REVIEW_PRICE_KRW ?? ''
const supportValues = [
  env.NEXT_PUBLIC_SUPPORT_URL,
  env.NEXT_PUBLIC_SUPPORT_COFFEE_URL,
  env.NEXT_PUBLIC_SUPPORT_BEER_URL,
  env.NEXT_PUBLIC_SUPPORT_TOSS,
]
const supportEnabled = [
  ...supportValues,
  env.NEXT_PUBLIC_SUPPORT_GITHUB_SPONSORS,
  env.NEXT_PUBLIC_SUPPORT_BMC,
].some(Boolean)
const newsletterEnabled = Boolean(env.NEXT_PUBLIC_BUTTONDOWN_USERNAME)

const errors = []
const warnings = []
const channels = []

for (const value of supportValues.filter(Boolean)) {
  try {
    if (new URL(value).protocol !== 'https:') errors.push('후원 URL은 https 주소여야 합니다.')
  } catch {
    errors.push('후원 URL 중 올바르지 않은 주소가 있습니다.')
  }
}

if (client) {
  if (!/^ca-pub-\d{16}$/.test(client)) {
    errors.push('NEXT_PUBLIC_ADSENSE_CLIENT는 ca-pub- 뒤에 숫자 16자리여야 합니다.')
  } else {
    channels.push('AdSense Auto ads')
  }
}

if (articleSlot) {
  if (!client) errors.push('광고 slot을 쓰려면 NEXT_PUBLIC_ADSENSE_CLIENT도 필요합니다.')
  if (!/^\d+$/.test(articleSlot)) errors.push('AdSense article slot은 숫자만 허용합니다.')
  if (client && /^\d+$/.test(articleSlot)) channels.push('본문 수동 광고')
}

if (reviewUrl) {
  try {
    const parsed = new URL(reviewUrl)
    if (!['https:', 'mailto:'].includes(parsed.protocol)) {
      errors.push('NEXT_PUBLIC_CFD_REVIEW_URL은 https 또는 mailto 주소여야 합니다.')
    } else {
      channels.push('CFD 프로젝트 검토')
    }
  } catch {
    errors.push('NEXT_PUBLIC_CFD_REVIEW_URL이 올바른 URL이 아닙니다.')
  }
}

if (reviewPrice && (!/^\d+$/.test(reviewPrice) || Number(reviewPrice) <= 0)) {
  errors.push('NEXT_PUBLIC_CFD_REVIEW_PRICE_KRW는 0보다 큰 정수여야 합니다.')
}

if (supportEnabled) channels.push('후원')
if (newsletterEnabled) channels.push('뉴스레터')

if (!client) warnings.push('AdSense client가 없어 광고가 표시되지 않습니다.')
if (!reviewUrl) warnings.push('CFD 프로젝트 검토 CTA가 비활성입니다.')
if (!newsletterEnabled) warnings.push('뉴스레터가 RSS 안내로 대체됩니다.')
if (!supportEnabled) warnings.push('후원 링크가 비활성입니다.')

console.log(`수익 채널 ${channels.length}개: ${channels.join(', ') || '없음'}`)
for (const warning of warnings) console.log(`경고: ${warning}`)
for (const error of errors) console.error(`오류: ${error}`)

if (errors.length > 0 || (strict && channels.length === 0)) process.exit(1)
