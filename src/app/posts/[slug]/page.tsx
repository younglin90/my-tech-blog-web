import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { Mdx } from '@/components/MDX'
import { ReadingProgress } from '@/components/ReadingProgress'
import { ShareButton } from '@/components/ShareButton'
import { TableOfContents } from '@/components/TableOfContents'
import { format, parseISO, compareDesc } from 'date-fns'
import Link from 'next/link'
import { PostNavShortcuts } from '@/components/PostNavShortcuts'
import { MarkAsRead } from '@/components/MarkAsRead'
import { PrintButton } from '@/components/PrintButton'
import { BookmarkButton } from '@/components/BookmarkButton'
import { dayMeta } from '@/lib/day-meta'
import type { Metadata } from 'next'

interface PostProps {
  params: Promise<{ slug: string }>
}

function getPublishedPosts() {
  return allPosts
    .filter((post) => !post.draft)
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
}

function getPostFromParams(slug: string) {
  return allPosts.find((post) => post._raw.flattenedPath === slug) ?? null
}

function getRelatedPosts(slug: string, tags: string[], limit = 3) {
  return allPosts
    .filter((p) => !p.draft && p._raw.flattenedPath !== slug)
    .map((p) => ({
      post: p,
      score: (p.tags ?? []).filter((t) => tags.includes(t)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post)
}

export async function generateMetadata({ params }: PostProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostFromParams(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags ?? [],
    alternates: {
      canonical: `https://tech-blog.dev/posts/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      url: `https://tech-blog.dev/posts/${slug}`,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
    },
  }
}

export async function generateStaticParams() {
  return allPosts
    .filter((post) => !post.draft)
    .map((post) => ({ slug: post._raw.flattenedPath }))
}

export default async function PostPage({ params }: PostProps) {
  const { slug } = await params
  const post = getPostFromParams(slug)
  if (!post) notFound()

  const posts = getPublishedPosts()
  const currentIndex = posts.findIndex((p) => p._raw.flattenedPath === slug)
  const prevPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null
  const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null
  const related = getRelatedPosts(slug, post.tags ?? [])

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    inLanguage: 'ko',
    keywords: (post.tags ?? []).join(', '),
    wordCount: post.wordCount,
    author: { '@type': 'Person', name: "영린's CFD Blog", url: 'https://tech-blog.dev/about' },
    publisher: { '@type': 'Organization', name: "영린's CFD Blog", url: 'https://tech-blog.dev' },
    url: `https://tech-blog.dev/posts/${slug}`,
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: "영린's CFD Blog", item: 'https://tech-blog.dev' },
      { '@type': 'ListItem', position: 2, name: post.title, item: `https://tech-blog.dev/posts/${slug}` },
    ],
  }

  return (
    <article className="py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <ReadingProgress />
      <PostNavShortcuts prevUrl={prevPost?.url} nextUrl={nextPost?.url} />
      <MarkAsRead id={post.slug} />

      {/* cd .. */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          href="/"
          className="mono transition-colors duration-100"
          style={{ fontSize: 12, color: 'var(--text-muted)' }}
        >
          <span style={{ color: 'var(--accent)' }}>$</span> cd ..
        </Link>
      </nav>

      {/* Meta strip: NOTE / DAY / DATE / READ — day-colored left border */}
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
                <span>
                  {post.tags.map((t) => (
                    <Link
                      key={t}
                      href={`/tags/${encodeURIComponent(t)}`}
                      className="mr-2 link-hover-text-accent"
                      style={{ color: 'var(--accent)' }}
                    >
                      #{t}
                    </Link>
                  ))}
                </span>
              </>
            )}
          </div>
        )
      })()}

      {/* Title */}
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

      {/* Italic lede with day-color border */}
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

      <TableOfContents />

      {/* Body */}
      <Mdx code={post.body.code} />

      {/* Share */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>도움이 됐다면 공유해주세요.</p>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          <BookmarkButton postId={post.slug} />
          <PrintButton />
          <ShareButton title={post.title} />
        </div>
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Related
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={r.url}
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

      {/* Prev / Next */}
      <nav
        className="mt-12 grid grid-cols-2 gap-3 border-t pt-6"
        style={{ borderColor: 'var(--border)' }}
      >
        {prevPost ? (
          <Link
            href={prevPost.url}
            className="prev-next-card group rounded-lg p-4 text-left"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="mono flex items-center gap-1.5"
              style={{ fontSize: 11, color: 'var(--text-faint)' }}
            >
              ← prev · #{String(posts.length - (currentIndex + 1)).padStart(3, '0')}
              <kbd className="rounded px-1 py-0.5 text-[9px]" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>K</kbd>
            </div>
            <div className="display mt-1.5" style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
              {prevPost.title}
            </div>
          </Link>
        ) : <div />}
        {nextPost ? (
          <Link
            href={nextPost.url}
            className="prev-next-card group rounded-lg p-4 text-right"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="mono flex items-center justify-end gap-1.5"
              style={{ fontSize: 11, color: 'var(--text-faint)' }}
            >
              <kbd className="rounded px-1 py-0.5 text-[9px]" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>J</kbd>
              next → · #{String(posts.length - (currentIndex - 1)).padStart(3, '0')}
            </div>
            <div className="display mt-1.5" style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4 }}>
              {nextPost.title}
            </div>
          </Link>
        ) : <div />}
      </nav>
    </article>
  )
}
