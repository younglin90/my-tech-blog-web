// Cloudflare Pages middleware: 첫 방문 시 자동 locale redirect.
// 우선순위: cookie(locale) > Accept-Language > cf-ipcountry > 'en'

const LOCALES = ['ko', 'en', 'ja', 'zh', 'es'] as const
type Locale = (typeof LOCALES)[number]

// ISO 3166-1 alpha-2 country code → site locale 매핑.
// 매핑 안 된 국가는 Accept-Language로 fallback (그것도 없으면 'en').
const COUNTRY_TO_LOCALE: Record<string, Locale> = {
  // 한국어
  KR: 'ko', KP: 'ko',

  // 일본어
  JP: 'ja',

  // 중국어 (간체 zh-CN을 사용하지만 사이트 노출은 'zh' 단일)
  CN: 'zh', TW: 'zh', HK: 'zh', MO: 'zh', SG: 'zh', // 싱가포르는 다언어, 일단 zh

  // 스페인어 (스페인 + LATAM 19개국)
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es',
  EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es',
  SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es', PR: 'es', GQ: 'es',

  // 영어 (공식·de-facto 영어권 — 그 외는 자연 fallback)
  US: 'en', GB: 'en', CA: 'en', AU: 'en', NZ: 'en', IE: 'en',
  IN: 'en', PK: 'en', BD: 'en', LK: 'en', PH: 'en', MY: 'en',
  ZA: 'en', NG: 'en', KE: 'en', GH: 'en', ZW: 'en', UG: 'en', ET: 'en',
  // 유럽 비영어권은 영어 fallback (자국어 미지원)
  DE: 'en', FR: 'en', IT: 'en', NL: 'en', SE: 'en', NO: 'en', FI: 'en',
  DK: 'en', PL: 'en', CZ: 'en', HU: 'en', AT: 'en', CH: 'en', BE: 'en',
  PT: 'en', GR: 'en', RO: 'en', RU: 'en', UA: 'en', TR: 'en',
  // 중동
  AE: 'en', SA: 'en', IL: 'en', QA: 'en',
  // 동남아 잔여
  ID: 'en', TH: 'en', VN: 'en',
}

function pickByCountry(country: string | undefined): Locale | null {
  if (!country) return null
  return COUNTRY_TO_LOCALE[country.toUpperCase()] ?? null
}

function pickByAcceptLanguage(accept: string | null): Locale | null {
  if (!accept) return null
  const lang = accept.toLowerCase().slice(0, 2)
  if ((LOCALES as readonly string[]).includes(lang)) return lang as Locale
  return null
}

interface Env {
  ADMIN_PASSWORD?: string
}

// /admin은 정적 export라 클라이언트 비밀번호 검사로는 막을 수 없다.
// 엣지에서 Basic Auth로 막는다. 사용자 이름은 무시하고 비밀번호만 본다.
// ADMIN_PASSWORD 미설정이면 아무도 들어오지 못한다.
async function adminAuthorized(request: Request, password: string | undefined): Promise<boolean> {
  if (!password) return false
  const header = request.headers.get('authorization') ?? ''
  if (!header.startsWith('Basic ')) return false
  let decoded: string
  try {
    decoded = atob(header.slice(6))
  } catch {
    return false
  }
  const given = decoded.slice(decoded.indexOf(':') + 1)
  // 길이·내용이 달라도 같은 시간이 걸리도록 해시끼리 비교한다.
  const enc = new TextEncoder()
  const [a, b] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(given)),
    crypto.subtle.digest('SHA-256', enc.encode(password)),
  ])
  const x = new Uint8Array(a)
  const y = new Uint8Array(b)
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, next, env } = ctx
  const url = new URL(request.url)

  // /admin, /admin/, /admin.html, /admin.txt(RSC payload) 모두 포함
  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/') || url.pathname.startsWith('/admin.')) {
    if (!(await adminAuthorized(request, env.ADMIN_PASSWORD))) {
      return new Response('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="cfdblog admin", charset="UTF-8"',
          'Cache-Control': 'no-store',
        },
      })
    }
    const res = await next()
    const out = new Response(res.body, res)
    out.headers.set('Cache-Control', 'no-store')
    return out
  }

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
    /^\/feed-(ko|en|ja|zh|es)\.(xml|json)$/.test(url.pathname) ||
    url.pathname === '/rag-index.json' ||
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
  // 이 302는 cookie / Accept-Language / CF-IPCountry에 따라 목적지가 달라진다.
  // Vary가 없으면 공유 캐시가 한 방문자의 locale 결과를 다른 방문자에게 그대로 준다.
  return new Response(null, {
    status: 302,
    headers: {
      Location: target.toString(),
      Vary: 'Cookie, Accept-Language, CF-IPCountry',
      'Cache-Control': 'no-store',
    },
  })
}
