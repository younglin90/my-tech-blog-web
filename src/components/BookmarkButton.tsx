'use client'

import { useEffect, useState } from 'react'
import { Bookmark, BookmarkCheck } from 'lucide-react'

const BOOKMARKS_KEY = 'cfd-lab-bookmarks'

export function getBookmarks(): Set<string> {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

function toggleBookmark(id: string): boolean {
  const bookmarks = getBookmarks()
  if (bookmarks.has(id)) {
    bookmarks.delete(id)
  } else {
    bookmarks.add(id)
  }
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks]))
  return bookmarks.has(id)
}

interface BookmarkButtonProps {
  postId: string
}

export function BookmarkButton({ postId }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setBookmarked(getBookmarks().has(postId))
  }, [postId])

  const handleClick = () => {
    const isNowBookmarked = toggleBookmark(postId)
    setBookmarked(isNowBookmarked)
  }

  if (!mounted) return null

  return (
    <button
      onClick={handleClick}
      className="share-btn flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${bookmarked ? 'var(--accent)' : 'var(--border)'}`,
        color: bookmarked ? 'var(--accent)' : 'var(--text-muted)',
      }}
      aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark this post'}
      title={bookmarked ? 'Remove bookmark' : 'Save for later'}
    >
      {bookmarked ? (
        <BookmarkCheck className="h-3.5 w-3.5" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
      {bookmarked ? 'Saved' : 'Save'}
    </button>
  )
}
