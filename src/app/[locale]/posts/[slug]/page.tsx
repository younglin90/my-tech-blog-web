import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { Mdx } from '@/components/MDX'
import { ReadingProgress } from '@/components/ReadingProgress'
import { ShareButton } from '@/components/ShareButton'
import { CiteButton } from '@/components/CiteButton'
import { TableOfContents } from '@/components/TableOfContents'
import { format, parseISO, compareDesc } from 'date-fns'
import Link from 'next/link'
import { PostNavShortcuts } from '@/components/PostNavShortcuts'
import { MarkAsRead } from '@/components/MarkAsRead'
import { ScrollDepth } from '@/components/ScrollDepth'
import { MathCopyLatex } from '@/components/MathCopyLatex'
import { ReadingPosition } from '@/components/ReadingPosition'
import { QuoteShare } from '@/components/QuoteShare'
import { LinkPreview } from '@/components/LinkPreview'
import { PostFeedback } from '@/components/PostFeedback'
import { PostSourceLinks } from '@/components/PostSourceLinks'
import { ReadingFontSize } from '@/components/ReadingFontSize'
import { ReadingFocusMode } from '@/components/ReadingFocusMode'
import { Giscus } from '@/components/Giscus'
import { AuthorBio } from '@/components/AuthorBio'
import { SeriesNav } from '@/components/SeriesNav'
import { getSeriesContext } from '@/lib/series'
import { PrintButton } from '@/components/PrintButton'
import { BookmarkButton } from '@/components/BookmarkButton'
import { dayMeta } from '@/lib/day-meta'
import { LOCALES, isLocale, t, type Locale } from '@/lib/i18n'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'

interface PostProps {
  params: Promise<{ locale: string; slug: string }>
}

function uniqueSlugs(): string[] {
  return Array.from(new Set(allPosts.filter((p) => !p.draft).map((p) => p.slug)))
}

function findPost(locale: Locale, slug: string) {
  // 1순위: 해당 locale 파일
  const direct = allPosts.find((p) => !p.draft && p.locale === locale && p.slug === slug)
  if (direct) return { post: direct, isFallback: false as const }
  // 2순위: ko fallback
  const ko = allPosts.find((p) => !p.draft && p.locale === 'ko' && p.slug === slug)
  return ko ? { post: ko, isFallback: locale !== 'ko' } : null
}

function getPublishedPostsForLocale(locale: Locale) {
  // ko 베이스 + locale 덮어쓰기 → 같은 slug 한 항목만
  const bySlug = new Map<string, typeof allPosts[number]>()
  allPosts.filter((p) => !p.draft && p.locale === 'ko').forEach((p) => bySlug.set(p.slug, p))
  if (locale !== 'ko') {
    allPosts.filter((p) => !p.draft && p.locale === locale).forEach((p) => bySlug.set(p.slug, p))
  }
  return Array.from(bySlug.values()).sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
}

function getRelatedPosts(locale: Locale, slug: string, tags: string[], limit = 3) {
  return getPublishedPostsForLocale(locale)
    .filter((p) => p.slug !== slug)
    .map((p) => ({ post: p, score: (p.tags ?? []).filter((t) => tags.includes(t)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post)
}

export async function generateStaticParams() {
  const slugs = uniqueSlugs()
  return LOCALES.flatMap((locale) => slugs.map((slug) => ({ locale, slug })))
}

export async function generateMetadata({ params }: PostProps): Promise<Metadata> {
  const { locale, slug } = await params
  if (!isLocale(locale)) return {}
  const found = findPost(locale as Locale, slug)
  if (!found) return {}
  const { post } = found
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags ?? [],
    alternates: {
      canonical: `${SITE_URL}/${locale}/posts/${slug}`,
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, `${SITE_URL}/${l}/posts/${slug}`])),
        'x-default': `${SITE_URL}/en/posts/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      url: `${SITE_URL}/${locale}/posts/${slug}`,
      authors: [`${SITE_URL}/${locale}/about`],
      tags: post.tags,
      locale: locale,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

export default async function PostPage({ params }: PostProps) {
  const { locale, slug } = await params
  if (!isLocale(locale)) notFound()
  const loc = locale as Locale
  const found = findPost(loc, slug)
  if (!found) notFound()
  const { post, isFallback } = found

  const posts = getPublishedPostsForLocale(loc)
  const currentIndex = posts.findIndex((p) => p.slug === slug)
  const prevPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null
  const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null
  const related = getRelatedPosts(loc, slug, post.tags ?? [])

  const updatedRaw = (post as unknown as { updated?: string }).updated
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    ...(updatedRaw ? { dateModified: updatedRaw } : {}),
    inLanguage: loc,
    keywords: (post.tags ?? []).join(', '),
    wordCount: post.wordCount,
    author: { '@type': 'Person', name: "Younglin's CFD Blog", url: `${SITE_URL}/${loc}/about` },
    publisher: { '@type': 'Organization', name: "Younglin's CFD Blog", url: `${SITE_URL}/${loc}` },
    url: `${SITE_URL}/${loc}/posts/${slug}`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/${loc}/posts/${slug}` },
    image: [`${SITE_URL}/${loc}/posts/${slug}/opengraph-image`],
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: "Younglin's CFD Blog", item: `${SITE_URL}/${loc}` },
      { '@type': 'ListItem', position: 2, name: post.title, item: `${SITE_URL}/${loc}/posts/${slug}` },
    ],
  }

  const localeLabel = ({ ko: '한국어', en: 'English', ja: '日本語', zh: '中文', es: 'Español' } as const)[loc]

  return (
    <article className="py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ReadingProgress />
      <PostNavShortcuts prevUrl={prevPost ? `/${loc}/posts/${prevPost.slug}` : undefined} nextUrl={nextPost ? `/${loc}/posts/${nextPost.slug}` : undefined} />
      <MarkAsRead id={post.slug} />
      <ScrollDepth postId={post.slug} />

      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href={`/${loc}`}
          className="mono inline-flex min-h-11 items-center transition-colors duration-100"
          style={{ fontSize: 12, color: 'var(--text-muted)' }}
        >
          <span style={{ color: 'var(--accent)' }}>$</span> cd ..
        </Link>
      </nav>

      {isFallback && (
        <div
          className="mb-6 rounded-md px-4 py-2.5 text-xs"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--accent)',
            color: 'var(--text-muted)',
          }}
        >
          {t(loc, 'post.translationFallback', { locale: localeLabel })}
        </div>
      )}

      {(() => {
        const day = dayMeta(post.date)
        const no = posts.length - currentIndex
        return (
          <div
            className="mono mb-8 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md px-4 py-2.5"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid ${day.colorVar}`,
              fontSize: 11,
              color: 'var(--text-muted)',
            }}
          >
            <span>
              NOTE <span style={{ color: 'var(--text)' }}>#{String(no).padStart(3, '0')}</span>
            </span>
            <span>
              DAY{' '}
              <span style={{ color: day.colorVar, fontWeight: 600 }}>{day.short}</span>{' '}
              <span style={{ color: 'var(--text)' }}>{day.label}</span>
            </span>
            <span>
              DATE <span className="tabular" style={{ color: 'var(--text)' }}>{format(parseISO(post.date), 'yyyy.MM.dd')}</span>
            </span>
            {updatedRaw && updatedRaw !== post.date && (
              <span title={t(loc, 'post.updated')}>
                UPDATED <span className="tabular" style={{ color: 'var(--accent)' }}>{format(parseISO(updatedRaw), 'yyyy.MM.dd')}</span>
              </span>
            )}
            {post.readingTime && (
              <span>
                READ <span style={{ color: 'var(--text)' }}>{post.readingTime}</span>
              </span>
            )}
            {post.wordCount && (
              <span>
                WORDS <span className="tabular" style={{ color: 'var(--text)' }}>{post.wordCount.toLocaleString()}</span>
              </span>
            )}
            {post.tags && post.tags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex min-w-0 max-w-full flex-wrap gap-x-2 gap-y-1">
                  {post.tags.map((tg) => (
                    <Link
                      key={tg}
                      href={`/${loc}/tags/${encodeURIComponent(tg)}`}
                      className="max-w-full break-all link-hover-text-accent"
                      style={{ color: 'var(--accent)' }}
                    >
                      #{tg}
                    </Link>
                  ))}
                </span>
              </>
            )}
          </div>
        )
      })()}

      <h1
        className="display"
        style={{
          fontSize: 38,
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
          margin: '0 0 16px',
          color: 'var(--text)',
        }}
      >
        {post.title}
      </h1>

      {post.description && (() => {
        const day = dayMeta(post.date)
        return (
          <p
            className="display"
            style={{
              fontSize: 19,
              fontStyle: 'italic',
              color: 'var(--text)',
              lineHeight: 1.6,
              margin: '0 0 40px',
              maxWidth: 680,
              paddingLeft: 16,
              borderLeft: `2px solid ${day.colorVar}`,
            }}
          >
            {post.description}
          </p>
        )
      })()}

      <SeriesNav locale={loc} ctx={getSeriesContext(loc, post.slug)} />

      <TableOfContents />

      <Mdx code={post.body.code} />
      <MathCopyLatex />
      <ReadingPosition postId={post.slug} />
      <QuoteShare />
      <LinkPreview />

      <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{t(loc, 'post.share')}</p>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <ReadingFontSize />
          <ReadingFocusMode />
          <CiteButton title={post.title} date={post.date} slug={post.slug} />
          <BookmarkButton postId={post.slug} />
          <PrintButton />
          <ShareButton title={post.title} />
        </div>
      </div>

      <PostSourceLinks locale={loc} slug={post.slug} />

      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {t(loc, 'post.related')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/${loc}/posts/${r.slug}`}
                className="group flex flex-col gap-1.5 rounded-lg p-3.5 transition-colors duration-100"
                style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
              >
                <span className="text-sm font-medium leading-snug link-hover-accent group-hover:text-[var(--accent)]" style={{ color: 'var(--text)' }}>
                  {r.title}
                </span>
                {r.description && (
                  <span className="line-clamp-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {r.description}
                  </span>
                )}
                <div className="mt-auto flex items-center gap-1.5 pt-1 text-[10px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
                  <span>{format(parseISO(r.date), 'MMM d, yyyy')}</span>
                  {r.readingTime && (
                    <>
                      <span>·</span>
                      <span>{r.readingTime}</span>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav
        className="mt-12 grid grid-cols-2 gap-3 border-t pt-6"
        style={{ borderColor: 'var(--border)' }}
      >
        {prevPost ? (
          <Link
            href={`/${loc}/posts/${prevPost.slug}`}
            className="prev-next-card group rounded-lg p-4 text-left"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="mono flex items-center gap-1.5"
              style={{ fontSize: 11, color: 'var(--text-faint)' }}
            >
              ← {t(loc, 'post.previous')} · #{String(posts.length - (currentIndex + 1)).padStart(3, '0')}
              <kbd className="rounded px-1 py-0.5 text-[9px]" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>K</kbd>
            </div>
            <div className="display mt-1.5" style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
              {prevPost.title}
            </div>
          </Link>
        ) : <div />}
        {nextPost ? (
          <Link
            href={`/${loc}/posts/${nextPost.slug}`}
            className="prev-next-card group rounded-lg p-4 text-right"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="mono flex items-center justify-end gap-1.5"
              style={{ fontSize: 11, color: 'var(--text-faint)' }}
            >
              <kbd className="rounded px-1 py-0.5 text-[9px]" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>J</kbd>
              {t(loc, 'post.next')} → · #{String(posts.length - (currentIndex - 1)).padStart(3, '0')}
            </div>
            <div className="display mt-1.5" style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
              {nextPost.title}
            </div>
          </Link>
        ) : <div />}
      </nav>

      <PostFeedback postId={post.slug} />

      <AuthorBio />

      <Giscus postId={post.slug} />
    </article>
  )
}
