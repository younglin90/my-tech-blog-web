import { allPosts } from 'contentlayer/generated'
import { compareDesc, parseISO, format } from 'date-fns'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About',
  description: 'CFD 연구자가 운영하는 기술 블로그 — 압축성 다상유동, 수치 기법, OpenFOAM 튜토리얼을 다룹니다.',
  alternates: { canonical: 'https://tech-blog.dev/about' },
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'CFD.Lab',
  url: 'https://tech-blog.dev',
  sameAs: ['https://github.com/younglin90'],
  knowsAbout: [
    'Computational Fluid Dynamics',
    'Compressible Multiphase Flow',
    'Riemann Solvers',
    'OpenFOAM',
    'Numerical Methods',
  ],
}

export default function AboutPage() {
  const published = allPosts
    .filter((p) => !p.draft)
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
  const totalWords = published.reduce((sum, p) => sum + (p.wordCount ?? 0), 0)
  const allTagSet = new Set(published.flatMap((p) => p.tags ?? []))
  const totalReadMinutes = published.reduce((sum, p) => {
    const mins = parseInt(p.readingTime ?? '0', 10)
    return sum + (isNaN(mins) ? 0 : mins)
  }, 0)
  const recentPosts = published.slice(0, 3)

  const lastPostDate = published[0] ? format(parseISO(published[0].date), 'MMM d') : '—'

  // Build monthly activity for the last 12 months
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
    { label: 'Posts', value: published.length.toString() },
    { label: 'Words', value: totalWords.toLocaleString() },
    { label: 'Tags', value: allTagSet.size.toString() },
    { label: 'Read time', value: `${Math.round(totalReadMinutes / 60)}h` },
    { label: 'Last post', value: lastPostDate },
  ]

  return (
    <div className="max-w-none">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <h1
        className="mb-4 text-4xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
      >
        About
      </h1>
      <p className="mb-8 text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Compressible multiphase flow CFD 수치해석을 연구하고 있습니다.
        이 블로그에서는 압축성 다상유동, 수치 기법, 그리고 CFD 전반에 대한
        이야기를 다룹니다. 포스트는 Claude Code가 매일 자동 생성하며, 검토 후 배포됩니다.
      </p>

      {/* Stats */}
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

      {/* Monthly activity chart */}
      <div className="mb-10 rounded-lg p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
          Activity (last 12 months)
        </p>
        <div className="flex items-end gap-1.5 h-12">
          {months.map(({ key, label, count }) => (
            <div key={key} className="flex flex-1 flex-col items-center gap-1" title={`${label}: ${count} post${count !== 1 ? 's' : ''}`}>
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

      <section className="mb-10">
        <h2
          className="mb-4 text-xl font-semibold"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          Research Interests
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
          Tech Stack
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
              Recent Posts
            </h2>
            <Link href="/" className="link-hover-text-accent text-xs">
              All posts →
            </Link>
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {recentPosts.map((post) => (
              <div key={post.slug} className="py-3">
                <Link href={post.url} className="link-hover-accent text-sm font-medium">
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
          Contact
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Feel free to reach out via{' '}
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
