import { allPosts } from 'contentlayer/generated'
import type { Locale } from '@/lib/i18n'

export interface SeriesSummary {
  slug: string
  count: number
  posts: Array<{
    slug: string
    title: string
    seriesOrder?: number
    date: string
    description: string
  }>
}

/** locale 기준으로 dedupe된 포스트만 사용 — 시리즈는 ko 베이스 + locale fallback */
function dedupedPostsForLocale(locale: Locale) {
  const bySlug = new Map<string, typeof allPosts[number]>()
  allPosts.filter((p) => !p.draft && p.locale === 'ko').forEach((p) => bySlug.set(p.slug, p))
  if (locale !== 'ko') {
    allPosts.filter((p) => !p.draft && p.locale === locale).forEach((p) => bySlug.set(p.slug, p))
  }
  return Array.from(bySlug.values())
}

export function listAllSeries(locale: Locale): SeriesSummary[] {
  const grouped = new Map<string, SeriesSummary>()
  for (const p of dedupedPostsForLocale(locale)) {
    const series = (p as any).series as string | undefined
    if (!series) continue
    if (!grouped.has(series)) grouped.set(series, { slug: series, count: 0, posts: [] })
    const entry = grouped.get(series)!
    entry.count += 1
    entry.posts.push({
      slug: p.slug,
      title: p.title,
      seriesOrder: (p as any).seriesOrder,
      date: p.date,
      description: p.description,
    })
  }
  for (const s of grouped.values()) {
    s.posts.sort((a, b) => {
      const ao = a.seriesOrder ?? 999
      const bo = b.seriesOrder ?? 999
      if (ao !== bo) return ao - bo
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })
  }
  return Array.from(grouped.values()).sort((a, b) => b.count - a.count)
}

export function getSeries(locale: Locale, slug: string): SeriesSummary | null {
  return listAllSeries(locale).find((s) => s.slug === slug) ?? null
}

export function getSeriesContext(locale: Locale, postSlug: string) {
  for (const s of listAllSeries(locale)) {
    const idx = s.posts.findIndex((p) => p.slug === postSlug)
    if (idx >= 0) {
      return {
        series: s,
        index: idx,
        prev: idx > 0 ? s.posts[idx - 1] : null,
        next: idx < s.posts.length - 1 ? s.posts[idx + 1] : null,
      }
    }
  }
  return null
}
