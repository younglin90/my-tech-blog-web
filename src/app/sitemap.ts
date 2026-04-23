import { allPosts } from 'contentlayer/generated'
import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

const SITE_URL = 'https://tech-blog.dev'
const LOCALES = ['ko', 'en', 'ja', 'zh', 'es'] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const koPosts = allPosts.filter((p) => !p.draft && p.locale === 'ko')
  const slugs = Array.from(new Set(koPosts.map((p) => p.slug)))
  const tags = Array.from(new Set(koPosts.flatMap((p) => p.tags ?? [])))

  const entries: MetadataRoute.Sitemap = []

  // 루트
  entries.push({ url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 })

  for (const locale of LOCALES) {
    entries.push({ url: `${SITE_URL}/${locale}`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 })
    entries.push({ url: `${SITE_URL}/${locale}/about`, changeFrequency: 'monthly', priority: 0.5 })
    entries.push({ url: `${SITE_URL}/${locale}/tags`, changeFrequency: 'weekly', priority: 0.6 })
  }

  for (const slug of slugs) {
    const post = koPosts.find((p) => p.slug === slug)
    const lastModified = post ? new Date(post.date) : new Date()
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}/posts/${slug}`,
        lastModified,
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
  }

  for (const tag of tags) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${SITE_URL}/${locale}/tags/${encodeURIComponent(tag)}`,
        changeFrequency: 'weekly',
        priority: 0.5,
      })
    }
  }

  return entries
}
