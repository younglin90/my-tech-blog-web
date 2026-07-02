import { allPosts } from 'contentlayer/generated'
import Link from 'next/link'
import { format, parseISO, compareDesc } from 'date-fns'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'

interface TagPageProps {
  params: Promise<{ locale: string; tag: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { locale, tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    title: `#${decoded}`,
    description: `Posts tagged "${decoded}"`,
    alternates: {
      canonical: `${SITE_URL}/${locale}/tags/${tag}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/tags/${tag}`])),
    },
  }
}

export async function generateStaticParams() {
  // 태그는 모든 locale 공통이 원칙이지만, 과거 포스트가 locale별로 다른 태그를
  // 가졌던 사례가 있어 전체 locale을 union — 정적 export에서 hard 404 방지.
  // 주의: raw 태그를 반환해야 한다. 미리 encodeURIComponent하면 Next가 한 번 더
  // 인코딩해 params.tag가 이중 인코딩으로 들어오고, 한글 태그 페이지가 전부 404가 된다.
  const tags = new Set<string>()
  allPosts
    .filter((post) => !post.draft)
    .forEach((post) => post.tags?.forEach((tag) => tags.add(tag)))
  return LOCALES.flatMap((locale) =>
    Array.from(tags).map((tag) => ({ locale, tag }))
  )
}

export default async function TagPage({ params }: TagPageProps) {
  const { locale, tag } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const decoded = decodeURIComponent(tag)

  // 해당 locale 포스트 우선 + ko fallback
  const bySlug = new Map<string, typeof allPosts[number]>()
  allPosts.filter((p) => !p.draft && p.locale === 'ko').forEach((p) => bySlug.set(p.slug, p))
  if (loc !== 'ko') {
    allPosts.filter((p) => !p.draft && p.locale === loc).forEach((p) => bySlug.set(p.slug, p))
  }
  const posts = Array.from(bySlug.values())
    .filter((post) => post.tags?.includes(decoded))
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))

  if (posts.length === 0) notFound()

  const totalReadMinutes = posts.reduce((sum, p) => {
    const mins = parseInt(p.readingTime ?? '0', 10)
    return sum + (isNaN(mins) ? 0 : mins)
  }, 0)

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: "Younglin's CFD Blog", item: `${SITE_URL}/${loc}` },
      { '@type': 'ListItem', position: 2, name: 'Tags', item: `${SITE_URL}/${loc}/tags` },
      { '@type': 'ListItem', position: 3, name: `#${decoded}`, item: `${SITE_URL}/${loc}/tags/${tag}` },
    ],
  }

  const relatedTagCounts: Record<string, number> = {}
  posts.forEach((post) => {
    post.tags?.forEach((tg) => {
      if (tg !== decoded) relatedTagCounts[tg] = (relatedTagCounts[tg] ?? 0) + 1
    })
  })
  const relatedTags = Object.entries(relatedTagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t)

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <div className="mb-8">
        <Link
          href={`/${loc}/tags`}
          className="mono"
          style={{ fontSize: 12, color: 'var(--text-muted)' }}
        >
          <span style={{ color: 'var(--accent)' }}>$</span> cd ..
        </Link>
        <div className="mono mt-3" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>grep</span>{' '}
          <span style={{ color: 'var(--text)' }}>&quot;#{decoded}&quot;</span>
          <span style={{ color: 'var(--text-faint)', marginLeft: 10 }}>
            // {posts.length} match{posts.length !== 1 ? 'es' : ''}
          </span>
        </div>
        <h1
          className="display mt-1"
          style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}
        >
          <span style={{ color: 'var(--accent)' }}>#</span>{decoded}
        </h1>
        {totalReadMinutes > 0 && (
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            ~{totalReadMinutes} {t(loc, 'post.minRead')}
          </p>
        )}
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {posts.map((post) => (
          <div key={post.slug} className="py-6">
            <h2
              className="mb-1.5 text-xl font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Link href={`/${loc}/posts/${post.slug}`} className="link-hover-accent">
                {post.title}
              </Link>
            </h2>
            <div className="mb-2 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <time dateTime={post.date}>{format(parseISO(post.date), 'MMM d, yyyy')}</time>
              {post.readingTime && (
                <>
                  <span style={{ color: 'var(--border)' }}>·</span>
                  <span>{post.readingTime}</span>
                </>
              )}
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {post.description}
            </p>
          </div>
        ))}
      </div>

      {relatedTags.length > 0 && (
        <div className="mt-10 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {t(loc, 'tags.relatedTags')}
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedTags.map((tg) => (
              <Link key={tg} href={`/${loc}/tags/${encodeURIComponent(tg)}`} className="tag-pill">
                #{tg}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
