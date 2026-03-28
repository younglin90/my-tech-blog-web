import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { Mdx } from '@/components/MDX'
import { ReadingProgress } from '@/components/ReadingProgress'
import { ShareButton } from '@/components/ShareButton'
import { TableOfContents } from '@/components/TableOfContents'
import { format, parseISO, compareDesc } from 'date-fns'
import Link from 'next/link'
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
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      url: `https://tech-blog.dev/posts/${slug}`,
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

  return (
    <article className="py-6">
      <ReadingProgress />

      {/* Header */}
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <time dateTime={post.date}>{format(parseISO(post.date), 'MMMM d, yyyy')}</time>
          {post.readingTime && (
            <>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span>{post.readingTime}</span>
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
              <Link
                key={tag}
                href={`/tags/${encodeURIComponent(tag)}`}
                className="rounded-full px-3 py-1 text-xs font-medium transition-colors duration-100"
                style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--accent)'
                  el.style.color = 'var(--accent)'
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--border)'
                  el.style.color = 'var(--text-muted)'
                }}
              >
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      <TableOfContents />

      {/* Body */}
      <Mdx code={post.body.code} />

      {/* Share */}
      <div className="mt-12 flex items-center justify-between border-t pt-6" style={{ borderColor: 'var(--border)' }}>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>도움이 됐다면 공유해주세요.</p>
        <ShareButton title={post.title} />
      </div>

      {/* Related posts */}
      {related.length > 0 && (
        <div className="mt-10">
          <h2
            className="mb-4 text-sm font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-muted)' }}
          >
            Related
          </h2>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {related.map((r) => (
              <div key={r.slug} className="py-4">
                <Link
                  href={r.url}
                  className="text-base font-medium transition-colors"
                  style={{ color: 'var(--text)' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
                >
                  {r.title}
                </Link>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {format(parseISO(r.date), 'MMM d, yyyy')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prev / Next */}
      <nav className="mt-10 flex items-center justify-between border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        {prevPost ? (
          <Link href={prevPost.url} className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>&larr; Previous</span>
            <span
              className="text-sm font-medium transition-colors"
              style={{ color: 'var(--text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
            >
              {prevPost.title}
            </span>
          </Link>
        ) : <div />}
        {nextPost ? (
          <Link href={nextPost.url} className="flex flex-col gap-1 text-right">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Next &rarr;</span>
            <span
              className="text-sm font-medium transition-colors"
              style={{ color: 'var(--text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
            >
              {nextPost.title}
            </span>
          </Link>
        ) : <div />}
      </nav>
    </article>
  )
}
