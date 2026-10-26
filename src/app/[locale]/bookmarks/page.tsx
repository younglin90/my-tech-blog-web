import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO } from 'date-fns'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { BookmarksClient } from '@/components/BookmarksClient'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'
import { slash } from '@/lib/jsonld'

interface BookmarksProps {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

// 북마크는 localStorage 기반 개인 페이지라 색인 대상이 아니다. 다만 링크는 따라가게 두어
// 여기서 나가는 포스트 링크가 크롤 경로로 남게 한다.
// canonical을 직접 지정하면 상위 layout이 물려주던 홈 hreflang 클러스터를 함께 끊는다.
export async function generateMetadata({ params }: BookmarksProps): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? (locale as Locale) : 'ko'
  return {
    title: t(loc, 'bookmarks.title'),
    description: t(loc, 'bookmarks.subtitle'),
    robots: { index: false, follow: true },
    alternates: { canonical: slash(`${SITE_URL}/${loc}/bookmarks`) },
  }
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
      url: `/${loc}/posts/${p.slug}/`,
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
