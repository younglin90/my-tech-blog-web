import { LOCALES, isLocale, t, HREFLANG, type Locale } from '@/lib/i18n'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

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
  const url = `${SITE_URL}/${loc}`

  return {
    title: { default: siteName, template: `%s | ${siteName}` },
    description,
    alternates: {
      canonical: url,
      languages: Object.fromEntries(LOCALES.map((l) => [HREFLANG[l], `${SITE_URL}/${l}`])),
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
  const loc = locale as Locale

  // 사이트 전역 구조화 데이터 (모든 페이지에 inject) — Person + Organization
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_URL}/#person`,
    name: SITE_NAMES[loc],
    url: `${SITE_URL}/${loc}/about`,
    sameAs: ['https://github.com/younglin90'],
    knowsLanguage: ['ko', 'en', 'ja', 'zh', 'es'],
    knowsAbout: [
      'Computational Fluid Dynamics',
      'Compressible Multiphase Flow',
      'Riemann Solvers',
      'Interface Capturing',
      'OpenFOAM',
      'Numerical Methods',
      'Finite Volume Method',
      'Discontinuous Galerkin Method',
    ],
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAMES[loc],
    url: `${SITE_URL}/${loc}`,
    logo: `${SITE_URL}/icon-512.png`,
    founder: { '@id': `${SITE_URL}/#person` },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      {children}
    </>
  )
}
