import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, SITE_NAMES, hreflangAlternates, type Locale } from '@/lib/i18n'
import { listAllSeries, getSeries } from '@/lib/series'
import { seriesTitle, seriesDescription } from '@/lib/series-title'
import { SeriesPostList } from '@/components/SeriesPostList'
import { SITE_URL } from '@/lib/site'

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const seriesSet = new Set<string>()
  for (const loc of LOCALES) {
    listAllSeries(loc).forEach((s) => seriesSet.add(s.slug))
  }
  // 빈 set이면 placeholder 반환 (Next.js output: export 요구사항).
  // 실제 시리즈 없으면 페이지 진입 시 notFound()로 빠진다.
  if (seriesSet.size === 0) {
    return LOCALES.map((locale) => ({ locale, slug: '_placeholder' }))
  }
  return LOCALES.flatMap((locale) => Array.from(seriesSet).map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const loc = isLocale(locale) ? (locale as Locale) : 'ko'
  const series = getSeries(loc, slug)
  // 예전에는 `${slug} series` / `Multi-part series: ${slug}` 였다 — 5개 locale 모두
  // 영어에다 사람이 읽을 수 없는 raw slug가 제목에 그대로 들어갔다.
  const name = seriesTitle(slug, loc)
  const count = String(series?.count ?? 0)
  const samples = (series?.posts ?? []).slice(0, 3).map((p) => p.title).join(' · ')
  const title = t(loc, 'series.metaTitle', { title: name, count })
  const description = t(loc, 'series.metaDescription', { title: name, count, samples })
  const url = `${SITE_URL}/${locale}/series/${slug}/`
  return {
    title: { absolute: `${title} | ${SITE_NAMES[loc]}` },
    description,
    alternates: {
      canonical: url,
      languages: hreflangAlternates(`/series/${slug}`),
    },
    openGraph: { title, description, url, siteName: SITE_NAMES[loc], type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function SeriesPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const series = getSeries(loc, slug)
  if (!series) notFound()
  const fmt = (d: string) => d.replaceAll('-', '.')
  const latest = [...series.posts].sort((a, b) => b.date.localeCompare(a.date))[0]
  const first = series.posts[0]
  const posts = series.posts.map((p) => ({ ...p, date: String(p.date).slice(0, 10) }))

  return (
    <div>
      <Link
        href={`/${loc}/series`}
        className="mono mb-3 inline-flex min-h-11 items-center"
        style={{ fontSize: 12, color: 'var(--text-muted)' }}
      >
        ← {t(loc, 'series.title')}
      </Link>
      <h1
        className="display mb-2"
        style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}
      >
        {seriesTitle(slug, loc)}
      </h1>
      {seriesDescription(slug, loc) && (
        <p className="mb-2 max-w-2xl text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>
          {seriesDescription(slug, loc)}
        </p>
      )}
      <p className="mono mb-5 text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
        {t(loc, 'series.parts', { count: String(series.count) })} · {fmt(series.started)} – {fmt(series.updated)}
      </p>
      <div className="mb-8 flex flex-wrap gap-2 text-xs">
        {first && (
          <Link
            href={`/${loc}/posts/${first.slug}`}
            className="inline-flex min-h-11 items-center rounded-lg px-3 font-medium"
            style={{ border: '1px solid var(--accent)', color: 'var(--accent)' }}
          >
            {t(loc, 'series.startHere')}
          </Link>
        )}
        {latest && latest.slug !== first?.slug && (
          <Link
            href={`/${loc}/posts/${latest.slug}`}
            className="inline-flex min-h-11 items-center rounded-lg px-3 font-medium"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            {t(loc, 'series.latestPost')} · {fmt(String(latest.date).slice(0, 10))}
          </Link>
        )}
      </div>

      <SeriesPostList locale={loc} posts={posts} />
    </div>
  )
}
