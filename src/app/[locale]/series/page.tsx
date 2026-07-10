import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import { listAllSeries } from '@/lib/series'
import { SITE_URL } from '@/lib/site'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const title = 'Series'
  const description = 'Multi-part article series organized by topic.'
  const url = `${SITE_URL}/${locale}/series`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/series`])),
        'x-default': `${SITE_URL}/en/series`,
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

export default async function SeriesIndex({ params }: Props) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const series = listAllSeries(locale as Locale)

  return (
    <div>
      <div className="mono mb-1" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent)' }}>$</span> ls series/
      </div>
      <h1
        className="display mb-2"
        style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}
      >
        {t(locale, 'series.title')}
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        {t(locale, 'series.summary', { count: String(series.length) })}
      </p>

      {series.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
          {t(locale, 'series.empty')}
        </p>
      ) : (
        <div className="space-y-4">
          {series.map((s) => (
            <Link
              key={s.slug}
              href={`/${locale}/series/${s.slug}`}
              className="group block rounded-lg p-5 transition-colors duration-100"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2
                  className="text-lg font-semibold link-hover-accent"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
                >
                  {s.slug}
                </h2>
                <span className="mono text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
                  {t(locale, 'series.parts', { count: String(s.count) })}
                </span>
              </div>
              <ol className="mt-3 space-y-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                {s.posts.slice(0, 4).map((p, i) => (
                  <li key={p.slug} className="flex items-baseline gap-2">
                    <span className="mono text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
                      {String(p.seriesOrder ?? i + 1).padStart(2, '0')}
                    </span>
                    <span className="line-clamp-1">{p.title}</span>
                  </li>
                ))}
                {s.posts.length > 4 && (
                  <li className="text-xs" style={{ color: 'var(--text-faint)' }}>
                    {t(locale, 'series.moreParts', { count: String(s.posts.length - 4) })}
                  </li>
                )}
              </ol>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
