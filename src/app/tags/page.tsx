import { allPosts } from 'contentlayer/generated'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tags',
  description: 'CFD.Lab의 모든 태그 — 주제별 포스트를 찾아보세요.',
  alternates: { canonical: 'https://tech-blog.dev/tags' },
}

function getAllTags() {
  const tagCount: Record<string, number> = {}
  allPosts
    .filter((post) => !post.draft)
    .forEach((post) => {
      post.tags?.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1
      })
    })
  return Object.entries(tagCount).sort((a, b) => b[1] - a[1])
}

export default function TagsPage() {
  const tags = getAllTags()

  return (
    <div>
      <h1
        className="mb-2 text-3xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
      >
        Tags
      </h1>
      <p className="mb-8 text-sm" style={{ color: 'var(--text-muted)' }}>
        {tags.length} tag{tags.length !== 1 ? 's' : ''} across all posts
      </p>
      <div className="flex flex-wrap gap-2">
        {tags.map(([tag, count]) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="tag-pill flex items-center gap-1.5"
          >
            {tag}
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
            >
              {count}
            </span>
          </Link>
        ))}
        {tags.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tags found.</p>
        )}
      </div>
    </div>
  )
}
