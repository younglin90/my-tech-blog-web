import { LOCALES, isLocale, t, HREFLANG, type Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

interface LocaleLayoutProps {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

const SITE_NAMES: Record<Locale, string> = {
  ko: "영린's CFD Blog",
  en: "Younglin's CFD Blog",
  ja: "Younglin's CFD Blog",
  zh: "Younglin's CFD Blog",
  es: "Younglin's CFD Blog",
}

const OG_LOCALE: Record<Locale, string> = {
  ko: 'ko_KR',
  en: 'en_US',
  ja: 'ja_JP',
  zh: 'zh_CN',
  es: 'es_ES',
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const loc = locale as Locale
  const siteName = SITE_NAMES[loc]
  const description = t(loc, 'home.subtitle')
  const url = `https://tech-blog.dev/${loc}`

  return {
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(LOCALES.map((l) => [HREFLANG[l], `https://tech-blog.dev/${l}`])),
    },
    openGraph: {
      title: siteName,
      description,
      url,
      siteName,
      locale: OG_LOCALE[loc],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description,
    },
  }
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <>{children}</>
}
