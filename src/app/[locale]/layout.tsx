import { LOCALES, isLocale, t, SITE_NAMES, OG_LOCALE, hreflangAlternates, type Locale } from '@/lib/i18n'
import { jsonLdHtml, PERSON_ID, ORG_ID, WEBSITE_ID } from '@/lib/jsonld'
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
      languages: hreflangAlternates(''),
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

  // 사이트 전역 구조화 데이터. Person / Organization / WebSite를 고정 @id로 묶어
  // 하나의 엔티티 그래프로 만든다 (예전에는 서로를 참조하지 않는 섬이었다).
  // locale이 달라도 엔티티는 하나이므로 노드 내용은 locale-invariant로 둔다.
  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': PERSON_ID,
    name: 'Younglin',
    alternateName: ['영린'],
    url: `${SITE_URL}/en/about/`,
    sameAs: ['https://github.com/younglin90'],
    knowsLanguage: [...LOCALES],
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
    '@id': ORG_ID,
    name: "Younglin's CFD Blog",
    alternateName: ["영린's CFD Blog"],
    url: `${SITE_URL}/`,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/icon-512.png`,
      width: 512,
      height: 512,
    },
    founder: { '@id': PERSON_ID },
  }

  // WebSite 노드는 사이트에 하나뿐이다. 하나의 @id가 다섯 언어를 동시에 뜻할 수 없으므로
  // inLanguage는 붙이지 않는다 (locale별 언어 선언은 각 페이지의 inLanguage가 담당).
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: `${SITE_URL}/`,
    name: "Younglin's CFD Blog",
    alternateName: ["영린's CFD Blog", 'cfdblog.cc'],
    publisher: { '@id': ORG_ID },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(personJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(organizationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(websiteJsonLd) }} />
      {children}
    </>
  )
}
