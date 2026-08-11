import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format, parseISO, compareDesc } from 'date-fns'
import type { Metadata } from 'next'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'
import { postsForLocale } from '@/lib/tags'
import { dayMeta } from '@/lib/day-meta'

// 전체 글 아카이브.
//
// 이 라우트가 없으면 오래된 글로 가는 유일한 경로가 홈의 최근 목록과 태그 페이지뿐이다.
// 태그 페이지는 대부분 포스트 1개짜리라 색인에서 뺐으므로(src/lib/tags.ts), 129편 전체가
// 홈에서 2클릭 안에 닿는 크롤 경로는 여기 하나다. 전부 서버에서 렌더한다 — 페이지네이션도
// 클라이언트 필터도 없어야 크롤러가 한 번에 전부 본다.

interface ArchiveProps {
  params: Promise<{ locale: string }>
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: ArchiveProps): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const loc = locale as Locale
  const count = String(postsForLocale(loc).length)
  const title = t(loc, 'archive.title')
  const description = t(loc, 'archive.subtitle', { count })
  const url = `${SITE_URL}/${loc}/posts`
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/posts`])),
        'x-default': `${SITE_URL}/en/posts`,
      },
    },
    openGraph: { title, description, url, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function ArchivePage({ params }: ArchiveProps) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale

  const posts = postsForLocale(loc).sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
  const total = posts.length

  // 연도별 그룹 (최신 연도 먼저)
  const byYear = new Map<string, typeof posts>()
  for (const p of posts) {
    const y = p.date.slice(0, 4)
    if (!byYear.has(y)) byYear.set(y, [])
    byYear.get(y)!.push(p)
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE_URL}/${loc}/posts/#collection`,
    name: t(loc, 'archive.title'),
    description: t(loc, 'archive.subtitle', { count: String(total) }),
    url: `${SITE_URL}/${loc}/posts/`,
    inLanguage: loc,
    isPartOf: { '@id': `${SITE_URL}/#website` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: total,
      itemListElement: posts.slice(0, 100).map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}/${loc}/posts/${p.slug}/`,
        name: p.title,
      })),
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/${loc}/` },
      { '@type': 'ListItem', position: 2, name: t(loc, 'archive.title'), item: `${SITE_URL}/${loc}/posts/` },
    ],
  }

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="mb-8">
        <Link href={`/${loc}`} className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>$</span> cd ..
        </Link>
        <div className="mono mt-3" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--accent)' }}>ls</span>{' '}
          <span style={{ color: 'var(--text)' }}>-lt posts/</span>
          <span style={{ color: 'var(--text-faint)', marginLeft: 10 }}>// {total}</span>
        </div>
        <h1
          className="display mt-1"
          style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}
        >
          {t(loc, 'archive.title')}
        </h1>
        <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: 620 }}>
          {t(loc, 'archive.subtitle', { count: String(total) })}
        </p>
      </div>

      {Array.from(byYear.entries()).map(([year, group]) => (
        <section key={year} className="mb-10">
          <div
            className="mono mb-3 flex items-baseline gap-3 border-b pb-1.5"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="tabular" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>
              {year}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-faint)' }}>
              {t(loc, 'archive.yearCount', { count: String(group.length) })}
            </span>
          </div>
          <ul className="m-0 list-none p-0">
            {group.map((p) => {
              const day = dayMeta(p.date)
              return (
                <li key={p.slug} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <Link
                    href={`/${loc}/posts/${p.slug}`}
                    className="archive-row flex flex-col gap-0.5 py-2.5 sm:flex-row sm:items-baseline sm:gap-3"
                  >
                    <time
                      dateTime={p.date}
                      className="mono tabular shrink-0"
                      style={{ fontSize: 11, color: 'var(--text-faint)', minWidth: 62 }}
                    >
                      {format(parseISO(p.date), 'MM.dd')}
                    </time>
                    <span
                      className="mono shrink-0"
                      style={{ fontSize: 10, color: day.colorVar, minWidth: 34 }}
                      aria-hidden="true"
                    >
                      {day.short}
                    </span>
                    <span
                      className="min-w-0 flex-1 leading-snug"
                      style={{ fontSize: 15, color: 'var(--text)' }}
                    >
                      {p.title}
                    </span>
                    {p.readingTime && (
                      <span
                        className="mono tabular shrink-0"
                        style={{ fontSize: 10, color: 'var(--text-faint)' }}
                      >
                        {p.readingTime}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
