import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, SITE_NAMES, hreflangAlternates, type Locale } from '@/lib/i18n'
import { CALCULATORS } from '@/lib/calculators'
import { ToolsCatalog } from '@/components/ToolsCatalog'
import { SITE_URL } from '@/lib/site'
import { ogFallbackImages } from '@/lib/og'
import { jsonLdHtml, slash } from '@/lib/jsonld'

interface Props { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? locale : 'en'
  const title = t(loc, 'tools.title')
  const description = t(loc, 'tools.subtitle')
  const url = slash(`${SITE_URL}/${locale}/tools`)
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: hreflangAlternates('/tools'),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAMES[loc],
      type: 'website',
      images: ogFallbackImages(SITE_URL, loc),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function ToolsIndex({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: t(loc, 'tools.title'),
    description: t(loc, 'tools.subtitle'),
    url: slash(`${SITE_URL}/${loc}/tools`),
    inLanguage: loc,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: CALCULATORS.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: slash(`${SITE_URL}/${loc}/tools/${tool.slug}`),
        name: tool.title[loc] ?? tool.title.en,
      })),
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
      <ToolsCatalog locale={loc} />
    </>
  )
}
