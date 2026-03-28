import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { Mdx } from '@/components/MDX'
import { ReadingProgress } from '@/components/ReadingProgress'
import { ShareButton } from '@/components/ShareButton'
import { TableOfContents } from '@/components/TableOfContents'
import { format, parseISO, compareDesc } from 'date-fns'
import Link from 'next/link'
import { ReadingETA } from '@/components/ReadingETA'
import { PostNavShortcuts } from '@/components/PostNavShortcuts'
import { MarkAsRead } from '@/components/MarkAsRead'
import { PrintButton } from '@/components/PrintButton'
import { BookmarkButton } from '@/components/BookmarkButton'
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
    author: { '@type': 'Person', name: 'CFD.Lab', url: 'https://tech-blog.dev/about' },
    publisher: { '@type': 'Organization', name: 'CFD.Lab', url: 'https://tech-blog.dev' },
    url: `https://tech-blog.dev/posts/${slug}`,
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'CFD.Lab', item: 'https://tech-blog.dev' },
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

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-8 flex items-center justify-between">
        <Link href="/" className="link-hover-text-accent text-xs">
          ← All posts
        </Link>
        {(Date.now() - new Date(post.date).getTime()) < 7 * 24 * 60 * 60 * 1000 && (
          <span className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ background: 'var(--accent)', color: '#08111f' }}>
            New
          </span>
        )}
      </nav>

      {/* Header */}
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span className="tabular-nums text-xs font-medium" style={{ color: 'var(--text-faint)' }}>
            #{posts.length - currentIndex}
          </span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <time dateTime={post.date}>{format(parseISO(post.date), 'MMMM d, yyyy')}</time>
          {post.readingTime && (() => {
            const mins = parseInt(post.readingTime ?? '0', 10)
            return (
              <>
                <span style={{ color: 'var(--border)' }}>·</span>
                {mins > 0 ? <ReadingETA totalMinutes={mins} /> : <span>{post.readingTime}</span>}
              </>
            )
          })()}
          {post.wordCount && (
            <>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="tabular-nums">{post.wordCount.toLocaleString()} words</span>
            </>
          )}
        </div>
        <h1
          className="mt-3 text-4xl font-bold leading-tight tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          {post.title}
        </h1>
        {post.tags && post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="tag-pill">
                {tag}
              </Link>
            ))}
          </div>
        )}
        {post.description && (
          <p className="mt-5 max-w-xl text-base leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {post.description}
          </p>
        )}
      </div>

      <TableOfContents />

      {/* Body */}
      <Mdx code={post.body.code} />

      {/* Share */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>도움이 됐다면 공유해주세요.</p>
        <div className="flex items-center gap-2">
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
      <nav className="mt-10 grid grid-cols-2 gap-4 border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        {prevPost ? (
          <Link href={prevPost.url} className="group flex flex-col gap-1 rounded-lg p-3 transition-colors duration-100" style={{ border: '1px solid var(--border)' }}>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              &larr; Previous
              <kbd className="rounded px-1 py-0.5 text-[9px]" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>K</kbd>
            </span>
            <span className="link-hover-accent text-sm font-medium leading-snug">{prevPost.title}</span>
            {prevPost.readingTime && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{prevPost.readingTime}</span>}
          </Link>
        ) : <div />}
        {nextPost ? (
          <Link href={nextPost.url} className="group flex flex-col gap-1 rounded-lg p-3 text-right transition-colors duration-100" style={{ border: '1px solid var(--border)' }}>
            <span className="flex items-center justify-end gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
              <kbd className="rounded px-1 py-0.5 text-[9px]" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)', color: 'var(--text-faint)' }}>J</kbd>
              Next &rarr;
            </span>
            <span className="link-hover-accent text-sm font-medium leading-snug">{nextPost.title}</span>
            {nextPost.readingTime && <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{nextPost.readingTime}</span>}
          </Link>
        ) : <div />}
      </nav>
    </article>
  )
}
