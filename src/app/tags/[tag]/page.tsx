import { allPosts } from 'contentlayer/generated'
import Link from 'next/link'
import { format, parseISO, compareDesc } from 'date-fns'
import type { Metadata } from 'next'

interface TagPageProps {
  params: Promise<{ tag: string }>
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { tag } = await params
  const decoded = decodeURIComponent(tag)
  return {
    title: `#${decoded}`,
    description: `Posts tagged with "${decoded}"`,
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

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/tags"
          className="text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)' }}
        >
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
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {posts.map((post) => (
          <div key={post.slug} className="py-6">
            <h2
              className="mb-1.5 text-xl font-semibold tracking-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <Link
                href={post.url}
                className="transition-colors"
                style={{ color: 'var(--text)' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--accent)' }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text)' }}
              >
                {post.title}
              </Link>
            </h2>
            <time dateTime={post.date} className="mb-2 block text-xs" style={{ color: 'var(--text-muted)' }}>
              {format(parseISO(post.date), 'MMM d, yyyy')}
            </time>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {post.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
