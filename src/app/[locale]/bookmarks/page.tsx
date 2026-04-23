import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO } from 'date-fns'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BookmarksClient } from '@/components/BookmarksClient'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'

interface BookmarksProps {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const metadata: Metadata = {
  title: 'Bookmarks',
  description: "Your saved Younglin's CFD Blog posts.",
  robots: { index: false },
}

export default async function BookmarksPage({ params }: BookmarksProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale

  // ko 베이스 + locale 덮어쓰기 (저장은 slug 기반이므로 locale별로 같은 slug 노출)
  const bySlug = new Map<string, typeof allPosts[number]>()
  allPosts.filter((p) => !p.draft && p.locale === 'ko').forEach((p) => bySlug.set(p.slug, p))
  if (loc !== 'ko') {
    allPosts.filter((p) => !p.draft && p.locale === loc).forEach((p) => bySlug.set(p.slug, p))
  }
  const posts = Array.from(bySlug.values())
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
    .map((p) => ({
      id: p.slug,
      title: p.title,
      date: p.date,
      description: p.description,
      tags: p.tags ?? [],
      readingTime: p.readingTime,
      url: `/${loc}/posts/${p.slug}`,
    }))

  return (
    <div className="max-w-none">
      <h1
        className="mb-2 text-4xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
      >
        {t(loc, 'bookmarks.title')}
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        {t(loc, 'bookmarks.subtitle')}
      </p>
      <BookmarksClient posts={posts} />
    </div>
  )
}
