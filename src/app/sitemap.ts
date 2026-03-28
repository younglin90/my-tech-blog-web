import { allPosts } from 'contentlayer/generated'
import type { MetadataRoute } from 'next'

const BASE = 'https://tech-blog.dev'

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts
    .filter((post) => !post.draft)
    .map((post) => ({
      url: `${BASE}/posts/${post._raw.flattenedPath}`,
      lastModified: new Date(post.date),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  return [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/tags`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ...posts,
  ]
}
