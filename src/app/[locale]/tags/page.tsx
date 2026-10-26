import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { TagsClient } from './TagsClient'
import { LOCALES, isLocale, t, SITE_NAMES, hreflangAlternates, type Locale } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'
import { jsonLdHtml, slash } from '@/lib/jsonld'
import { tagFrequency } from '@/lib/tags'

interface TagsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: TagsPageProps): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? (locale as Locale) : 'ko'
  const title = t(loc, 'tags.title')
  const description = t(loc, 'tags.metaHubDescription', { count: String(tagFrequency(loc).size) })
  const url = `${SITE_URL}/${locale}/tags/`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: hreflangAlternates('/tags'),
    },
    openGraph: { title, description, url, siteName: SITE_NAMES[loc], type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

function getAllTags() {
  const tagCount: Record<string, number> = {}
  // ko 베이스로만 집계 (tags는 모든 locale 공통)
  allPosts
    .filter((post) => !post.draft && post.locale === 'ko')
    .forEach((post) => {
      post.tags?.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })
  return Object.entries(tagCount)
}

export default async function TagsPage({ params }: TagsPageProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const tags = getAllTags()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${SITE_NAMES[locale]} — ${t(locale, 'tags.title')}`,
    numberOfItems: tags.length,
    itemListElement: tags
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: tag,
        url: slash(`${SITE_URL}/${locale}/tags/${encodeURIComponent(tag)}`),
      })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
      <TagsClient tags={tags} locale={locale} />
    </>
  )
}
