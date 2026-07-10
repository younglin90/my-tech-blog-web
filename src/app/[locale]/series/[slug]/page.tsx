import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import { listAllSeries, getSeries } from '@/lib/series'
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
  const title = `${slug} series`
  const description = `Multi-part series: ${slug}`
  const url = `${SITE_URL}/${locale}/series/${slug}`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/series/${slug}`])),
        'x-default': `${SITE_URL}/en/series/${slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Younglin's CFD Blog",
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function SeriesPage({ params }: Props) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const series = getSeries(locale as Locale, slug)
  if (!series) notFound()

  return (
    <div>
      <Link
        href={`/${locale}/series`}
        className="mono mb-3 inline-block"
        style={{ fontSize: 12, color: 'var(--text-muted)' }}
      >
        <span style={{ color: 'var(--accent)' }}>$</span> cd ..
      </Link>
      <h1
        className="display mb-2"
        style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}
      >
        {slug}
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        {t(locale, 'series.sequential', { count: String(series.count) })}
      </p>

      <ol className="space-y-3">
        {series.posts.map((p, i) => (
          <li key={p.slug}>
            <Link
              href={`/${locale}/posts/${p.slug}`}
              className="group flex items-start gap-4 rounded-lg p-4 transition-colors duration-100"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md font-semibold tabular-nums"
                style={{ background: 'var(--accent-glow)', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}
              >
                {String(p.seriesOrder ?? i + 1).padStart(2, '0')}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium link-hover-accent" style={{ color: 'var(--text)' }}>
                  {p.title}
                </p>
                <p className="mt-0.5 line-clamp-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {p.description}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-faint)' }}>
                  {format(parseISO(p.date), 'MMM d, yyyy')}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
