import { allPosts } from 'contentlayer/generated'
import type { Metadata } from 'next'
import { TagsClient } from './TagsClient'

export const metadata: Metadata = {
  title: 'Tags',
  description: 'CFD.Lab의 모든 태그 — 주제별 포스트를 찾아보세요.',
  alternates: { canonical: 'https://tech-blog.dev/tags' },
}

function getAllTags() {
  const tagCount: Record<string, number> = {}
  allPosts
    .filter((post) => !post.draft)
    .forEach((post) => {
      post.tags?.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })
  return Object.entries(tagCount)
}

export default function TagsPage() {
  const tags = getAllTags()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'CFD.Lab Tags',
    numberOfItems: tags.length,
    itemListElement: tags
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag], i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: tag,
        url: `https://tech-blog.dev/tags/${encodeURIComponent(tag)}`,
      })),
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TagsClient tags={tags} />
    </>
  )
}
