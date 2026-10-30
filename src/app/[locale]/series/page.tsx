import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, SITE_NAMES, hreflangAlternates, type Locale } from '@/lib/i18n'
import { listAllSeries } from '@/lib/series'
import { seriesTitle, seriesDescription } from '@/lib/series-title'
import { SITE_URL } from '@/lib/site'
import { ogFallbackImages } from '@/lib/og'

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? (locale as Locale) : 'ko'
  const title = t(loc, 'series.title')
  const description = t(loc, 'series.metaHubDescription', { count: String(listAllSeries(loc).length) })
  const url = `${SITE_URL}/${locale}/series/`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: hreflangAlternates('/series'),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAMES[loc],
      type: 'website',
      images: ogFallbackImages(SITE_URL, loc),
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
  const loc = locale as Locale
  const series = listAllSeries(loc)
  const totalPosts = series.reduce((n, s) => n + s.count, 0)
  const recent = [...series].sort((a, b) => b.updated.localeCompare(a.updated)).slice(0, 3)
  const fmt = (d: string) => d.replaceAll('-', '.')

  return (
    <div>
      <h1
        className="display mb-2"
        style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}
      >
        {t(loc, 'series.title')}
      </h1>
      <p className="mb-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        {t(loc, 'series.summary', { count: String(series.length), posts: String(totalPosts) })}
      </p>
      <p className="mb-8 text-xs" style={{ color: 'var(--text-faint)' }}>
        {t(loc, 'series.autoNote')}
      </p>

      {series.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
          {t(loc, 'series.empty')}
        </p>
      ) : (
        <>
          <section className="mb-10" aria-labelledby="series-recent">
            <h2 id="series-recent" className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
              {t(loc, 'series.recent')}
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {recent.map((s) => {
                const latest = [...s.posts].sort((a, b) => b.date.localeCompare(a.date))[0]
                return (
                  <Link
                    key={s.slug}
                    href={`/${loc}/posts/${latest.slug}`}
                    className="group block rounded-lg p-4 transition-colors duration-100 hover:[border-color:var(--accent)]"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                  >
                    <div className="mono text-[11px]" style={{ color: 'var(--accent)' }}>
                      {seriesTitle(s.slug, loc)} · {fmt(s.updated)}
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-sm font-medium link-hover-accent" style={{ color: 'var(--text)' }}>
                      {latest.title}
                    </p>
                  </Link>
                )
              })}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            {series.map((s, idx) => {
              const latest = [...s.posts].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3)
              const first = s.posts[0]
              return (
                <article
                  key={s.slug}
                  className="flex flex-col rounded-lg p-5"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                      <span className="mono mr-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <Link href={`/${loc}/series/${s.slug}`} className="link-hover-accent">
                        {seriesTitle(s.slug, loc)}
                      </Link>
                    </h2>
                    <span className="mono shrink-0 text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
                      {t(loc, 'series.parts', { count: String(s.count) })}
                    </span>
                  </div>
                  {seriesDescription(s.slug, loc) && (
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)', lineHeight: 1.65 }}>
                      {seriesDescription(s.slug, loc)}
                    </p>
                  )}
                  <p className="mono mt-2 text-[11px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
                    {fmt(s.started)} – {fmt(s.updated)}
                  </p>
                  <ol className="mt-3 space-y-1.5 border-t pt-3 text-sm" style={{ borderColor: 'var(--border-soft)' }}>
                    {latest.map((p) => (
                      <li key={p.slug} className="flex items-baseline gap-2">
                        <span className="mono shrink-0 text-[11px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
                          {fmt(p.date.slice(0, 10)).slice(2)}
                        </span>
                        <Link href={`/${loc}/posts/${p.slug}`} className="line-clamp-1 link-hover-accent" style={{ color: 'var(--text-muted)' }}>
                          {p.title}
                        </Link>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs">
                    <Link
                      href={`/${loc}/series/${s.slug}`}
                      className="inline-flex min-h-11 items-center rounded-lg px-3 font-medium"
                      style={{ border: '1px solid var(--accent)', color: 'var(--accent)' }}
                    >
                      {t(loc, 'series.viewAll', { count: String(s.count) })}
                    </Link>
                    {first && (
                      <Link
                        href={`/${loc}/posts/${first.slug}`}
                        className="inline-flex min-h-11 items-center rounded-lg px-3 font-medium"
                        style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                      >
                        {t(loc, 'series.startHere')}
                      </Link>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
