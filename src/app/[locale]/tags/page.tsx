import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { TagsClient } from './TagsClient'
import { LOCALES, isLocale } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'

interface TagsPageProps {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: TagsPageProps): Promise<Metadata> {
  const { locale } = await params
  return {
    title: 'Tags',
    description: 'All tags on the blog — browse posts by topic.',
    alternates: {
      canonical: `${SITE_URL}/${locale}/tags`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/tags`])),
    },
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
    name: "Younglin's CFD Blog Tags",
    numberOfItems: tags.length,
    itemListElement: tags
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: tag,
        url: `${SITE_URL}/${locale}/tags/${encodeURIComponent(tag)}`,
      })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TagsClient tags={tags} locale={locale} />
    </>
  )
}
