'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Bookmark, BookmarkCheck } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'

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
  // Safari 프라이빗 모드·쿼터 초과 시 setItem이 throw — 클릭 핸들러가 죽지 않게 가드
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...bookmarks]))
  } catch {}
  return bookmarks.has(id)
}

interface BookmarkButtonProps {
  postId: string
}

export function BookmarkButton({ postId }: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

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
      className="share-btn flex min-h-11 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
      style={{
        background: 'var(--surface)',
        border: `1px solid ${bookmarked ? 'var(--accent)' : 'var(--border)'}`,
        color: bookmarked ? 'var(--accent)' : 'var(--text-muted)',
      }}
      aria-label={bookmarked ? t(locale, 'bookmarks.remove') : t(locale, 'post.save')}
      title={bookmarked ? t(locale, 'bookmarks.remove') : t(locale, 'post.save')}
    >
      {bookmarked ? (
        <BookmarkCheck className="h-3.5 w-3.5" />
      ) : (
        <Bookmark className="h-3.5 w-3.5" />
      )}
      {bookmarked ? t(locale, 'post.saved') : t(locale, 'post.save')}
    </button>
  )
}
