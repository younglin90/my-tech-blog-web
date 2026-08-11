import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import vizManifest from '@/lib/viz-manifest.json'
import { SITE_URL } from '@/lib/site'
import { jsonLdHtml, WEBSITE_ID } from '@/lib/jsonld'
import { VizGalleryClient } from '@/components/VizGalleryClient'

interface Props { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? locale : 'en'
  const title = t(loc, 'viz.title')
  const description = t(loc, 'viz.subtitle')
  const url = `${SITE_URL}/${locale}/viz`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/viz`])),
        'x-default': `${SITE_URL}/en/viz`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Younglin's CFD Blog",
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

interface VizItem {
  component: string
  type: string
  postSlug: string
  postTitle: string
  postUrl: string
  file?: string
}

export default async function VizGallery({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const items = vizManifest as VizItem[]

  // 갤러리는 클라이언트 컴포넌트라 크롤러가 목록을 못 본다. ItemList로 선언해
  // 어떤 시각화가 어느 글에 들어 있는지 구조화 데이터로 남긴다.
  const listJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/${loc}/viz/#webpage`,
    url: `${SITE_URL}/${loc}/viz/`,
    name: t(loc, 'viz.title'),
    description: t(loc, 'viz.subtitle'),
    inLanguage: loc,
    isPartOf: { '@id': WEBSITE_ID },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.slice(0, 100).map((v, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: v.component,
        ...(v.postSlug ? { url: `${SITE_URL}/${loc}/posts/${v.postSlug}/` } : {}),
      })),
    },
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(listJsonLd) }} />
      <VizGalleryClient locale={loc} items={items} />
    </>
  )
}
