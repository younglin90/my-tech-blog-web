import { allPosts } from 'contentlayer/generated'
import { notFound } from 'next/navigation'
import { Mdx } from '@/components/MDX'
import { ReadingProgress } from '@/components/ReadingProgress'
import { format, parseISO, compareDesc } from 'date-fns'
import Link from 'next/link'
import type { Metadata } from 'next'

interface PostProps {
  params: Promise<{
    slug: string
  }>
}

function getPublishedPosts() {
  return allPosts
    .filter((post) => !post.draft)
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)))
}

function getPostFromParams(slug: string) {
  return allPosts.find((post) => post._raw.flattenedPath === slug) ?? null
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
    .map((post) => ({
      slug: post._raw.flattenedPath,
    }))
}

export default async function PostPage({ params }: PostProps) {
  const { slug } = await params
  const post = getPostFromParams(slug)

  if (!post) {
    notFound()
  }

  const posts = getPublishedPosts()
  const currentIndex = posts.findIndex((p) => p._raw.flattenedPath === slug)
  const prevPost = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null
  const nextPost = currentIndex > 0 ? posts[currentIndex - 1] : null

  return (
    <article className="py-6">
      <ReadingProgress />
      <div className="mb-10 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <time dateTime={post.date}>
            {format(parseISO(post.date), 'MMMM d, yyyy')}
          </time>
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

      <Mdx code={post.body.code} />

      <nav className="mt-16 flex items-center justify-between border-t pt-8" style={{ borderColor: 'var(--border)' }}>
        {prevPost ? (
          <Link href={prevPost.url} className="group flex flex-col gap-1">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>&larr; Previous</span>
            <span className="text-sm font-medium transition-colors" style={{ color: 'var(--text)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
            >
              {prevPost.title}
            </span>
          </Link>
        ) : <div />}
        {nextPost ? (
          <Link href={nextPost.url} className="group flex flex-col gap-1 text-right">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Next &rarr;</span>
            <span className="text-sm font-medium transition-colors" style={{ color: 'var(--text)' }}
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
