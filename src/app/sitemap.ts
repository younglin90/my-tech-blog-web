import { allPosts } from 'contentlayer/generated'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const SITE_URL = 'https://tech-blog.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts.filter((p) => !p.draft)

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post._raw.flattenedPath}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const tags = [...new Set(posts.flatMap((p) => p.tags ?? []))]
  const tagEntries: MetadataRoute.Sitemap = tags.map((tag) => ({
    url: `${SITE_URL}/tags/${encodeURIComponent(tag)}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }))

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/tags`, changeFrequency: 'weekly', priority: 0.6 },
    ...postEntries,
    ...tagEntries,
  ]
}
