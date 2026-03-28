import { allPosts } from 'contentlayer/generated'
import Link from 'next/link'
import { format, parseISO, compareDesc } from 'date-fns'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'

interface TagPageProps {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    title: `#${decoded}`,
    description: `"${decoded}" 태그의 CFD.Lab 포스트 모음`,
    alternates: { canonical: `https://tech-blog.dev/tags/${tag}` },
  }
}

export async function generateStaticParams() {
  const tags = new Set<string>()
  allPosts
    .filter((post) => !post.draft)
    .forEach((post) => post.tags?.forEach((tag) => tags.add(tag)))
  return Array.from(tags).map((tag) => ({ tag: encodeURIComponent(tag) }))
}

export default async function TagPage({ params }: TagPageProps) {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)

  const posts = allPosts
    .filter((post) => !post.draft && post.tags?.includes(decoded))
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
      { '@type': 'ListItem', position: 1, name: 'CFD.Lab', item: 'https://tech-blog.dev' },
      { '@type': 'ListItem', position: 2, name: 'Tags', item: 'https://tech-blog.dev/tags' },
      { '@type': 'ListItem', position: 3, name: `#${decoded}`, item: `https://tech-blog.dev/tags/${tag}` },
    ],
  }

  // Related tags: co-occurring tags sorted by frequency
  const relatedTagCounts: Record<string, number> = {}
  posts.forEach((post) => {
    post.tags?.forEach((t) => {
      if (t !== decoded) relatedTagCounts[t] = (relatedTagCounts[t] ?? 0) + 1
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
        <Link href="/tags" className="link-hover-text-accent text-xs">
          ← All tags
        </Link>
        <h1
          className="mt-2 text-3xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
        >
          <span style={{ color: 'var(--accent)' }}>#</span>{decoded}
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {posts.length} post{posts.length !== 1 ? 's' : ''}
          {totalReadMinutes > 0 && (
            <span style={{ color: 'var(--text-faint)' }}>
              {' '}· ~{totalReadMinutes} min total
            </span>
          )}
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {posts.map((post) => (
          <div key={post.slug} className="py-6">
            <h2
              className="mb-1.5 text-xl font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Link href={post.url} className="link-hover-accent">
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
            Related Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {relatedTags.map((t) => (
              <Link key={t} href={`/tags/${encodeURIComponent(t)}`} className="tag-pill">
                #{t}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
