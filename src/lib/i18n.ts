import { SITE_URL } from '@/lib/site'
import ko from '@/i18n/ko.json'
import en from '@/i18n/en.json'
import ja from '@/i18n/ja.json'
import zh from '@/i18n/zh.json'
import es from '@/i18n/es.json'

export const LOCALES = ['ko', 'en', 'ja', 'zh', 'es'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'ko'

const dict: Record<Locale, Record<string, string>> = { ko, en, ja, zh, es }

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value)
}

export function t(locale: string | undefined, key: string, vars?: Record<string, string>): string {
  const loc: Locale = isLocale(locale) ? locale : DEFAULT_LOCALE
  const raw = dict[loc][key] ?? dict[DEFAULT_LOCALE][key] ?? key
  if (!vars) return raw
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, 'g'), v), raw)
}

export const LOCALE_LABELS: Record<Locale, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  zh: '中文',
  es: 'Español',
}

// IANA locale → BCP47 hreflang
export const HREFLANG: Record<Locale, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
  es: 'es-ES',
}

export function localePathPrefix(pathname: string): { locale: Locale; rest: string } {
  const m = pathname.match(/^\/(ko|en|ja|zh|es)(\/.*)?$/)
  if (m) return { locale: m[1] as Locale, rest: m[2] ?? '/' }
  return { locale: DEFAULT_LOCALE, rest: pathname }
}

export function withLocale(locale: Locale, path: string): string {
  const clean = path.startsWith('/') ? path : `/${path}`
  // strip existing locale prefix if any
  const stripped = clean.replace(/^\/(ko|en|ja|zh|es)(?=\/|$)/, '') || '/'
  return `/${locale}${stripped === '/' ? '' : stripped}` || `/${locale}`
}

// 사이트 표시 이름 / OG locale. 여러 라우트가 이걸 필요로 해서 layout 안에 두지 않는다.
export const SITE_NAMES: Record<Locale, string> = {
  ko: "영린's CFD Blog",
  en: "Younglin's CFD Blog",
  ja: "Younglin's CFD Blog",
  zh: "Younglin's CFD Blog",
  es: "Younglin's CFD Blog",
}

export const OG_LOCALE: Record<Locale, string> = {
  ko: 'ko_KR',
  en: 'en_US',
  ja: 'ja_JP',
  zh: 'zh_CN',
  es: 'es_ES',
}

/**
 * hreflang alternates. 사이트 전체가 하나의 어휘를 써야 한다 —
 * sitemap이 bare code(ko/en/…)를 쓰므로 여기서도 bare code로 통일한다.
 * (HREFLANG의 BCP47 형태는 <html lang> 쪽에서만 쓴다.)
 * trailingSlash: true라 canonical이 슬래시로 끝나므로 여기도 맞춘다.
 */
export function hreflangAlternates(path: string): Record<string, string> {
  return {
    ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}/`])),
    'x-default': `${SITE_URL}/en${path}/`,
  }
}
