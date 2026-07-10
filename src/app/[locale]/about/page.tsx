import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO, format } from 'date-fns'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ReadingStats } from '@/components/ReadingStats'
import { TopPosts } from '@/components/TopPosts'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'

interface AboutProps {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: AboutProps): Promise<Metadata> {
  const { locale } = await params
  const loc = isLocale(locale) ? locale : 'en'
  const title = 'About'
  const description = t(loc, 'about.intro')
  const url = `${SITE_URL}/${locale}/about`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/about`])),
        'x-default': `${SITE_URL}/en/about`,
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

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: "Younglin's CFD Blog",
  url: SITE_URL,
  sameAs: ['https://github.com/younglin90'],
  knowsAbout: [
    'Computational Fluid Dynamics',
    'Compressible Multiphase Flow',
    'Riemann Solvers',
    'OpenFOAM',
    'Numerical Methods',
  ],
}

export default async function AboutPage({ params }: AboutProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale

  // ko 베이스로 통계 (모든 locale 동일 통계 노출)
  const published = allPosts
    .filter((p) => !p.draft && p.locale === 'ko')
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
  const totalWords = published.reduce((sum, p) => sum + (p.wordCount ?? 0), 0)
  const allTagSet = new Set(published.flatMap((p) => p.tags ?? []))
  const totalReadMinutes = published.reduce((sum, p) => {
    const mins = parseInt(p.readingTime ?? '0', 10)
    return sum + (isNaN(mins) ? 0 : mins)
  }, 0)
  const recentPosts = published.slice(0, 3)
  const lastPostDate = published[0] ? format(parseISO(published[0].date), 'MMM d') : '—'

  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return { key: format(d, 'yyyy-MM'), label: format(d, 'MMM'), count: 0 }
  })
  published.forEach((p) => {
    const key = format(parseISO(p.date), 'yyyy-MM')
    const m = months.find((m) => m.key === key)
    if (m) m.count++
  })
  const maxMonthCount = Math.max(...months.map((m) => m.count), 1)

  const stats = [
    { label: t(loc, 'about.stats.posts'), value: published.length.toString() },
    { label: t(loc, 'about.stats.words'), value: totalWords.toLocaleString() },
    { label: t(loc, 'about.stats.tags'), value: allTagSet.size.toString() },
    { label: t(loc, 'about.stats.readTime'), value: `${Math.round(totalReadMinutes / 60)}h` },
    { label: t(loc, 'about.stats.lastPost'), value: lastPostDate },
  ]

  return (
    <div className="max-w-none">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <div className="mono mb-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--accent)' }}>$</span> whoami
      </div>
      <h1
        className="display mb-4"
        style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}
      >
        {t(loc, 'about.title')}
      </h1>
      <p className="mb-8 text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {t(loc, 'about.intro')}
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg p-4 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="text-2xl font-bold tabular-nums" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
              {value}
            </div>
            <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div className="mb-10 rounded-lg p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
          {t(loc, 'about.activity')}
        </p>
        <div className="flex items-end gap-1.5 h-12">
          {months.map(({ key, label, count }) => (
            <div key={key} className="flex flex-1 flex-col items-center gap-1" title={`${label}: ${count} posts`}>
              <div
                className="w-full rounded-sm transition-all duration-300"
                style={{
                  height: count === 0 ? '2px' : `${Math.max(8, (count / maxMonthCount) * 40)}px`,
                  background: count === 0 ? 'var(--border)' : 'var(--accent)',
                  opacity: count === 0 ? 0.3 : 0.6 + (count / maxMonthCount) * 0.4,
                }}
              />
              <span className="text-[8px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
                {label.slice(0, 1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ReadingStats posts={published.map((p) => ({ id: p.slug, readingTime: p.readingTime }))} />

      <TopPosts locale={loc} heading={t(loc, 'about.topPosts')} />

      <section className="mb-10">
        <h2
          className="mb-4 text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          {t(loc, 'about.researchInterests')}
        </h2>
        <ul className="space-y-2">
          {[
            'Compressible multiphase flow simulation',
            'Riemann solvers — HLLC, Roe, AUSM+',
            'Interface capturing methods — VOF, Level Set, Diffuse Interface',
            'High-order finite volume / discontinuous Galerkin methods',
            'Shock–interface interaction problems',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: 'var(--accent)' }} />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2
          className="mb-4 text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          {t(loc, 'about.techStack')}
        </h2>
        <div className="flex flex-wrap gap-2">
          {[
            'Next.js 16',
            'Contentlayer',
            'Tailwind CSS 4',
            'KaTeX',
            'rehype-pretty-code',
            'Cloudflare Pages',
          ].map((tech) => (
            <span
              key={tech}
              className="rounded px-2.5 py-1 text-xs font-medium"
              style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      {recentPosts.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between">
            <h2
              className="text-xl font-semibold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
            >
              {t(loc, 'about.recentPosts')}
            </h2>
            <Link href={`/${loc}`} className="link-hover-text-accent text-xs">
              {t(loc, 'about.allPosts')} →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentPosts.map((post) => (
              <div key={post.slug} className="py-3">
                <Link href={`/${loc}/posts/${post.slug}`} className="link-hover-accent text-sm font-medium">
                  {post.title}
                </Link>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-faint)' }}>
                  {format(parseISO(post.date), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2
          className="mb-4 text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          {t(loc, 'about.contact')}
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {t(loc, 'about.contactBody')}{' '}
          <a
            href="https://github.com/younglin90"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium underline underline-offset-4 transition-opacity hover:opacity-75"
            style={{ color: 'var(--accent)' }}
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </div>
  )
}
