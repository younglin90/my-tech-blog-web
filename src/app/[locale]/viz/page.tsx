import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, SITE_NAMES, hreflangAlternates, type Locale } from '@/lib/i18n'
import vizManifest from '@/lib/viz-manifest.json'
import { SITE_URL } from '@/lib/site'
import { jsonLdHtml, slash, WEBSITE_ID } from '@/lib/jsonld'
import { VizGalleryClient } from '@/components/VizGalleryClient'
import { listAllSeries, postSeries } from '@/lib/series'
import { seriesTitle } from '@/lib/series-title'

interface Props { params: Promise<{ locale: string }> }

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? locale : 'en'
  const title = t(loc, 'viz.title')
  const description = t(loc, 'viz.subtitle')
  const url = slash(`${SITE_URL}/${locale}/viz`)
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: hreflangAlternates('/viz'),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAMES[loc],
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
  const postBySlug = new Map(
    allPosts.filter((p) => !p.draft && p.locale === loc).map((p) => [p.slug, p]),
  )
  // 글 날짜와 주제(시리즈)를 붙여, 갤러리를 최신 순·주제별로 나눠 보여 준다.
  const items = (vizManifest as VizItem[])
    .map((item) => {
      const post = postBySlug.get(item.postSlug)
      return {
        ...item,
        postTitle: post?.title ?? item.postTitle,
        date: post ? String(post.date).slice(0, 10) : (item.postSlug.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? ''),
        series: post ? postSeries(post as { series?: string; tags?: string[] }) : undefined,
      }
    })
    .sort((a, b) => b.date.localeCompare(a.date))
  const topics = listAllSeries(loc)
    .map((s) => ({ slug: s.slug, title: seriesTitle(s.slug, loc), count: items.filter((i) => i.series === s.slug).length }))
    .filter((s) => s.count > 0)

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
      <VizGalleryClient locale={loc} items={items} topics={topics} />
    </>
  )
}
