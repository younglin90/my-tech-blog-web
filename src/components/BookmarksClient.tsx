'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { BookmarkX } from 'lucide-react'

const BOOKMARKS_KEY = 'cfd-lab-bookmarks'

function getBookmarkIds(): string[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function removeBookmark(id: string) {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    const set: string[] = raw ? JSON.parse(raw) : []
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(set.filter((s) => s !== id)))
  } catch {}
}

interface BookmarkPost {
  id: string
  title: string
  date: string
  description: string
  tags: string[]
  readingTime?: string
  url: string
}

interface BookmarksClientProps {
  posts: BookmarkPost[]
}

export function BookmarksClient({ posts }: BookmarksClientProps) {
  const [bookmarkIds, setBookmarkIds] = useState<string[] | null>(null)

  useEffect(() => {
    setBookmarkIds(getBookmarkIds())
  }, [])

  const handleRemove = (id: string) => {
    removeBookmark(id)
    setBookmarkIds((prev) => (prev ?? []).filter((b) => b !== id))
  }

  if (bookmarkIds === null) {
    // Loading skeleton
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 rounded-lg" />
        ))}
      </div>
    )
  }

  const bookmarked = posts.filter((p) => bookmarkIds.includes(p.id))

  if (bookmarked.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl" style={{ color: 'var(--border)' }}>⊕</p>
        <p className="mt-3 text-sm font-medium" style={{ color: 'var(--text)' }}>No bookmarks yet</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          Save posts for later by clicking the <strong>Save</strong> button on any post.
        </p>
        <Link
          href="/"
          className="mt-5 inline-block rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent)', color: '#08111f' }}
        >
          Browse Posts
        </Link>
      </div>
    )
  }

  return (
    <div>
      <p className="mb-6 text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
        {bookmarked.length} saved post{bookmarked.length !== 1 ? 's' : ''}
      </p>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {bookmarked.map((post) => (
          <div key={post.id} className="group flex items-start justify-between gap-4 py-5">
            <div className="min-w-0 flex-1">
              <Link
                href={post.url}
                className="link-hover-accent text-base font-semibold leading-snug"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {post.title}
              </Link>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                {post.description}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                <time dateTime={post.date}>{format(parseISO(post.date), 'MMM d, yyyy')}</time>
                {post.readingTime && (
                  <>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <span>{post.readingTime}</span>
                  </>
                )}
              </div>
              {post.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {post.tags.slice(0, 4).map((tag) => (
                    <Link key={tag} href={`/tags/${encodeURIComponent(tag)}`} className="tag-pill-sm">
                      {tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleRemove(post.id)}
              className="shrink-0 rounded p-1.5 opacity-0 transition-opacity duration-100 group-hover:opacity-100"
              style={{ color: 'var(--text-faint)' }}
              aria-label={`Remove bookmark: ${post.title}`}
              title="Remove bookmark"
            >
              <BookmarkX className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
