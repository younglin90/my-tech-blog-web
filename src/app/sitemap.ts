import { allPosts } from 'contentlayer/generated'
import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-static'
const LOCALES = ['ko', 'en', 'ja', 'zh', 'es'] as const

// Next.js generateSitemaps()로 5개 locale별 sitemap을 분리 생성한다.
// 결과: /sitemap.xml(인덱스), /sitemap/ko.xml, /sitemap/en.xml, ...
export async function generateSitemaps() {
  return LOCALES.map((id) => ({ id }))
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
  const locale = id as (typeof LOCALES)[number]

  // ko 베이스 + 해당 locale 덮어쓰기 → 같은 slug 중복 제거
  const bySlug = new Map<string, typeof allPosts[number]>()
  allPosts.filter((p) => !p.draft && p.locale === 'ko').forEach((p) => bySlug.set(p.slug, p))
  if (locale !== 'ko') {
    allPosts.filter((p) => !p.draft && p.locale === locale).forEach((p) => bySlug.set(p.slug, p))
  }
  const posts = Array.from(bySlug.values())
  const slugs = posts.map((p) => p.slug)
  const tags = Array.from(new Set(posts.flatMap((p) => p.tags ?? [])))

  // hreflang alternates: 각 URL에 대해 5개 locale 모두 매핑
  const alternateLanguages = (path: string) =>
    Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}${path}`]))

  const entries: MetadataRoute.Sitemap = []

  entries.push({
    url: `${SITE_URL}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1.0,
    alternates: { languages: alternateLanguages('') },
  })

  entries.push({
    url: `${SITE_URL}/${locale}/about`,
    changeFrequency: 'monthly',
    priority: 0.5,
    alternates: { languages: alternateLanguages('/about') },
  })

  entries.push({
    url: `${SITE_URL}/${locale}/tags`,
    changeFrequency: 'weekly',
    priority: 0.6,
    alternates: { languages: alternateLanguages('/tags') },
  })

  for (const slug of slugs) {
    const post = posts.find((p) => p.slug === slug)
    // updated 필드가 있으면 그것을 우선 사용 (검색엔진에 글 수정을 알림)
    const updatedRaw = (post as unknown as { updated?: string })?.updated
    const lastMod = updatedRaw ? new Date(updatedRaw) : post ? new Date(post.date) : new Date()
    entries.push({
      url: `${SITE_URL}/${locale}/posts/${slug}`,
      lastModified: lastMod,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: alternateLanguages(`/posts/${slug}`) },
    })
  }

  for (const tag of tags) {
    const tagPath = `/tags/${encodeURIComponent(tag)}`
    entries.push({
      url: `${SITE_URL}/${locale}${tagPath}`,
      changeFrequency: 'weekly',
      priority: 0.5,
      alternates: { languages: alternateLanguages(tagPath) },
    })
  }

  return entries
}
