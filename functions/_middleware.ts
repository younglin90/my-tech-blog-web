// Cloudflare Pages middleware: 첫 방문 시 자동 locale redirect.
// 우선순위: cookie(locale) > Accept-Language > cf-ipcountry > 'en'

const LOCALES = ['ko', 'en', 'ja', 'zh', 'es'] as const
type Locale = (typeof LOCALES)[number]

function pickByCountry(country: string | undefined): Locale | null {
  if (!country) return null
  if (country === 'KR') return 'ko'
  if (country === 'JP') return 'ja'
  if (country === 'CN' || country === 'TW' || country === 'HK' || country === 'MO') return 'zh'
  if (['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'].includes(country)) return 'es'
  return null
}

function pickByAcceptLanguage(accept: string | null): Locale | null {
  if (!accept) return null
  const lang = accept.toLowerCase().slice(0, 2)
  if ((LOCALES as readonly string[]).includes(lang)) return lang as Locale
  return null
}

export const onRequest: PagesFunction = async (ctx) => {
  const { request, next } = ctx
  const url = new URL(request.url)

  // locale prefix 이미 있으면 통과
  if (/^\/(ko|en|ja|zh|es)(\/|$)/.test(url.pathname)) return next()
  // 정적 자산·API·시스템 경로는 통과
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/admin') ||
    url.pathname.startsWith('/preview') ||
    url.pathname.startsWith('/read') ||
    url.pathname === '/feed.xml' ||
    url.pathname === '/feed.json' ||
    url.pathname === '/sitemap.xml' ||
    url.pathname === '/robots.txt' ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/icon.svg' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/icon-192.png' ||
    url.pathname === '/icon-512.png' ||
    url.pathname.includes('.')
  ) {
    return next()
  }

  // 루트(/) 또는 알 수 없는 경로 → 적절한 locale로 redirect
  const cookieMatch = (request.headers.get('cookie') ?? '').match(/(?:^|;\s*)locale=(ko|en|ja|zh|es)/)
  const cookieLocale = cookieMatch?.[1] as Locale | undefined

  const cf = (request as unknown as { cf?: { country?: string } }).cf
  const country = cf?.country
  const acceptLang = request.headers.get('accept-language')

  const locale: Locale =
    cookieLocale ?? pickByCountry(country) ?? pickByAcceptLanguage(acceptLang) ?? 'en'

  const target = new URL(url.toString())
  // 루트면 /{locale}/, 기타 경로면 /{locale}{path}
  if (url.pathname === '/' || url.pathname === '') {
    target.pathname = `/${locale}/`
  } else {
    target.pathname = `/${locale}${url.pathname}`
  }
  return Response.redirect(target.toString(), 302)
}
