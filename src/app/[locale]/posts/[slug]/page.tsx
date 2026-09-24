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
import { AdSlot } from '@/components/AdSlot'
import { PostSourceLinks } from '@/components/PostSourceLinks'
import { ReadingFontSize } from '@/components/ReadingFontSize'
import { ReadingFocusMode } from '@/components/ReadingFocusMode'
import { Giscus } from '@/components/Giscus'
import { AuthorBio } from '@/components/AuthorBio'
import { SeriesNav } from '@/components/SeriesNav'
import { getSeriesContext } from '@/lib/series'
import { PrintButton } from '@/components/PrintButton'
import { BookmarkButton } from '@/components/BookmarkButton'
import { CfdReviewCallout } from '@/components/CfdReviewCallout'
import { dayMeta } from '@/lib/day-meta'
import { LOCALES, isLocale, t, SITE_NAMES, OG_LOCALE, HREFLANG, hreflangAlternates, type Locale } from '@/lib/i18n'
import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site'
import { jsonLdHtml, PERSON_ID, ORG_ID, WEBSITE_ID, titleFromSlug } from '@/lib/jsonld'

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

/**
 * 관련 글 추천.
 *
 * 예전 구현은 공유 태그 "개수"만 셌다. 그러면 CFD·Multiphase 같은 흔한 태그가 희귀 태그와
 * 같은 무게를 갖고, 동점이면 JS의 안정 정렬이 항상 최신 글에 몰아준다. 그 결과 최근 40편은
 * 평균 5.67개의 인바운드를 받고 오래된 40편은 1.32개, 28편은 0개였다.
 *
 * IDF 가중 코사인 유사도로 바꾸고, 동점은 (같은 시리즈 → 발행일 근접 → slug) 순으로
 * 결정론적으로 깬다. 이미 많이 참조된 글에는 작은 페널티를 준다. 그리고 유사한 글이
 * 부족하면 시리즈 → 시간적 이웃 → 인바운드가 가장 적은 글 순으로 반드시 3개를 채운다.
 */
function getRelatedPosts(locale: Locale, slug: string, tags: string[], limit = 3) {
  const all = getPublishedPostsForLocale(locale)
  const N = all.length

  const df = new Map<string, number>()
  for (const p of all) for (const tg of p.tags ?? []) df.set(tg, (df.get(tg) ?? 0) + 1)
  const idf = (tg: string) => Math.log(1 + N / (df.get(tg) ?? 1))

  // 각 글이 현재 몇 번이나 남의 추천 목록에 뽑히는지를 근사 — 흔한 태그를 많이 단 글일수록 높다
  const pull = (p: (typeof all)[number]) => (p.tags ?? []).reduce((a, tg) => a + (df.get(tg) ?? 1), 0)
  const maxPull = Math.max(1, ...all.map(pull))

  const self = new Set(tags)
  const selfNorm = Math.sqrt([...self].reduce((a, tg) => a + idf(tg) ** 2, 0)) || 1
  const here = all.find((p) => p.slug === slug)
  const hereTime = here ? parseISO(here.date).getTime() : 0
  const hereSeries = (here as unknown as { series?: string } | undefined)?.series

  const scored = all
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const pt = p.tags ?? []
      const norm = Math.sqrt(pt.reduce((a, tg) => a + idf(tg) ** 2, 0)) || 1
      const dot = pt.filter((tg) => self.has(tg)).reduce((a, tg) => a + idf(tg) ** 2, 0)
      const sim = dot / (selfNorm * norm)
      const sameSeries = hereSeries && (p as unknown as { series?: string }).series === hereSeries
      return {
        post: p,
        score: sim + (sameSeries ? 0.35 : 0) - 0.08 * (pull(p) / maxPull),
        dt: Math.abs(parseISO(p.date).getTime() - hereTime),
      }
    })
    .sort((a, b) => b.score - a.score || a.dt - b.dt || a.post.slug.localeCompare(b.post.slug))

  const out = scored.filter((x) => x.score > 0).slice(0, limit).map((x) => x.post)

  // 항상 3개를 채운다 — 태그가 겹치지 않는 글도 발행일이 가까운 이웃은 읽을 만하다
  if (out.length < limit) {
    for (const x of scored) {
      if (out.length >= limit) break
      if (!out.includes(x.post)) out.push(x.post)
    }
  }
  return out
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
  const loc = locale as Locale
  // 빌드 시 계산된 SERP 설명. frontmatter description은 ko 중앙값 41자로 스니펫 예산의
  // 절반밖에 못 쓴다 (contentlayer.config.ts의 seoDescription 참고).
  const seo = post.seoDescription || post.description

  return {
    // absolute — " | Younglin's CFD Blog" 접미사(16~21자)를 붙이지 않는다.
    // ko 제목 중앙값이 42자라 접미사까지 붙으면 100%가 SERP에서 잘린다.
    title: { absolute: post.title },
    description: seo,
    // 본문이 빈약한 글과 ko 원문을 그대로 내보내는 fallback 페이지는 색인에서 뺀다.
    ...(post.noindex || found.isFallback ? { robots: { index: false, follow: true } } : {}),
    keywords: post.tags ?? [],
    alternates: {
      canonical: `${SITE_URL}/${locale}/posts/${slug}/`,
      languages: hreflangAlternates(`/posts/${slug}`),
    },
    openGraph: {
      title: post.title,
      description: seo,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: (post as unknown as { updated?: string }).updated ?? post.date,
      url: `${SITE_URL}/${locale}/posts/${slug}/`,
      siteName: SITE_NAMES[loc],
      authors: [`${SITE_URL}/${locale}/about/`],
      tags: post.tags,
      locale: OG_LOCALE[loc],
      alternateLocale: LOCALES.filter((l) => l !== loc).map((l) => OG_LOCALE[l]),
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: seo,
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
  const seriesCtx = getSeriesContext(loc, post.slug)
  const postUrl = `${SITE_URL}/${loc}/posts/${slug}/`
  const readMinutes = parseInt(post.readingTime ?? '0', 10)

  // 브레드크럼 중간 단계: 시리즈가 있으면 시리즈, 없으면 가장 희귀한(=가장 구체적인) 태그.
  // Google은 마크업이 화면에 보이는 것과 일치할 것을 요구하므로 아래 시각 브레드크럼도 같이 바꾼다.
  const rarestTag = (() => {
    const all = posts
    const df = new Map<string, number>()
    for (const p of all) for (const tg of p.tags ?? []) df.set(tg, (df.get(tg) ?? 0) + 1)
    return (post.tags ?? []).slice().sort((a, b) => (df.get(a) ?? 0) - (df.get(b) ?? 0))[0]
  })()
  const mid = seriesCtx
    ? {
        name: titleFromSlug(seriesCtx.series.slug),
        url: `${SITE_URL}/${loc}/series/${seriesCtx.series.slug}/`,
        href: `/${loc}/series/${seriesCtx.series.slug}`,
      }
    : rarestTag
      ? {
          name: `#${rarestTag}`,
          url: `${SITE_URL}/${loc}/tags/${encodeURIComponent(rarestTag)}/`,
          href: `/${loc}/tags/${encodeURIComponent(rarestTag)}`,
        }
      : null

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${postUrl}#article`,
    headline: post.title,
    description: post.seoDescription || post.description,
    datePublished: post.date,
    dateModified: updatedRaw ?? post.date,
    inLanguage: HREFLANG[loc],
    // 번역본은 ko 원문의 번역임을 명시한다 — 같은 글의 5개 사본이 아니라 한 저작물의 번역본들.
    ...(loc !== 'ko' && !isFallback
      ? { translationOfWork: { '@id': `${SITE_URL}/ko/posts/${slug}/#article` } }
      : {}),
    keywords: (post.tags ?? []).join(', '),
    about: post.tags ?? [],
    articleSection: dayMeta(post.date).label,
    wordCount: post.wordCount,
    ...(readMinutes > 0 ? { timeRequired: `PT${readMinutes}M` } : {}),
    author: { '@id': PERSON_ID },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': WEBSITE_ID },
    url: postUrl,
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    image: [
      {
        '@type': 'ImageObject',
        url: `${SITE_URL}/${loc}/posts/${slug}/opengraph-image`,
        width: 1200,
        height: 630,
      },
    ],
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAMES[loc], item: `${SITE_URL}/${loc}/` },
      ...(mid ? [{ '@type': 'ListItem', position: 2, name: mid.name, item: mid.url }] : []),
      { '@type': 'ListItem', position: mid ? 3 : 2, name: post.title, item: postUrl },
    ],
  }

  const localeLabel = ({ ko: '한국어', en: 'English', ja: '日本語', zh: '中文', es: 'Español' } as const)[loc]

  return (
    <article className="py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbJsonLd) }} />
      <ReadingProgress />
      <PostNavShortcuts prevUrl={prevPost ? `/${loc}/posts/${prevPost.slug}` : undefined} nextUrl={nextPost ? `/${loc}/posts/${nextPost.slug}` : undefined} />
      <MarkAsRead id={post.slug} />
      <ScrollDepth postId={post.slug} />

      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-x-2">
        <Link
          href={`/${loc}`}
          className="mono inline-flex min-h-11 items-center transition-colors duration-100"
          style={{ fontSize: 12, color: 'var(--text-muted)' }}
        >
          <span style={{ color: 'var(--accent)' }}>$</span> cd ..
        </Link>
        {mid && (
          <Link
            href={mid.href}
            className="mono link-hover-text-accent inline-flex min-h-11 items-center"
            style={{ fontSize: 12, color: 'var(--text-faint)' }}
          >
            / {mid.name}
          </Link>
        )}
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

      {loc !== 'ko' && !isFallback && (
        <p className="mb-6 text-xs" style={{ color: 'var(--text-muted)' }}>
          {t(loc, 'post.translatedFrom')}{' '}
          <Link href={`/ko/posts/${slug}/`} hrefLang="ko" lang="ko" style={{ color: 'var(--accent)' }}>
            {t(loc, 'post.translatedFromLink')}
          </Link>
        </p>
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
              <span className="hidden sm:inline">
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
          fontSize: 'clamp(1.75rem, 7vw, 38px)',
          fontWeight: 700,
          letterSpacing: '-0.025em',
          lineHeight: 1.15,
          margin: '0 0 16px',
          color: 'var(--text)',
        }}
      >
        {post.title}
      </h1>

      {(() => {
        // 데크는 독자가 처음 읽는 한 문장이다. description은 SERP 스니펫이라
        // 검색으로 들어온 사람에게는 방금 본 문장을 그대로 반복하는 셈이 된다.
        // takeaway가 있으면 그걸 쓴다 (신규 글부터 — daily-post.md 참고).
        const dek = (post as unknown as { takeaway?: string }).takeaway || post.description
        if (!dek) return null
        const day = dayMeta(post.date)
        return (
          <p
            className="display"
            style={{
              fontSize: 'clamp(1rem, 4.4vw, 19px)',
              fontStyle: 'italic',
              color: 'var(--text)',
              lineHeight: 1.6,
              margin: '0 0 40px',
              maxWidth: 680,
              paddingLeft: 16,
              borderLeft: `2px solid ${day.colorVar}`,
            }}
          >
            {dek}
          </p>
        )
      })()}

      <SeriesNav locale={loc} ctx={seriesCtx} />

      <TableOfContents />

      <Mdx code={post.body.code} />
      <AdSlot />
      <MathCopyLatex />
      <ReadingPosition postId={post.slug} />
      <QuoteShare />
      <LinkPreview />

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
                data-umami-event="related-post-click"
                data-umami-event-source={post.slug}
                data-umami-event-slug={r.slug}
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
            data-umami-event="post-sequence-click"
            data-umami-event-direction="previous"
            data-umami-event-source={post.slug}
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
            data-umami-event="post-sequence-click"
            data-umami-event-direction="next"
            data-umami-event-source={post.slug}
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

      <PostFeedback postId={post.slug} />

      <CfdReviewCallout source="post" />

      <AuthorBio />

      <Giscus postId={post.slug} />
    </article>
  )
}
