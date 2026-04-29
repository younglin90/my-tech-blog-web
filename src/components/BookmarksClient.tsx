'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { BookmarkX, Download, Search } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'

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
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

  useEffect(() => {
    setBookmarkIds(getBookmarkIds())
  }, [])

  const handleRemove = (id: string) => {
    removeBookmark(id)
    setBookmarkIds((prev) => (prev ?? []).filter((b) => b !== id))
  }

  const bookmarked = useMemo(
    () => (bookmarkIds === null ? [] : posts.filter((p) => bookmarkIds.includes(p.id))),
    [posts, bookmarkIds],
  )

  const tagCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const p of bookmarked) for (const tag of p.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [bookmarked])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return bookmarked.filter((p) => {
      if (activeTag && !p.tags.includes(activeTag)) return false
      if (!q) return true
      return [p.title, p.description, p.tags.join(' ')].join(' ').toLowerCase().includes(q)
    })
  }, [bookmarked, query, activeTag])

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      count: bookmarked.length,
      bookmarks: bookmarked.map((p) => ({
        id: p.id, title: p.title, date: p.date, url: p.url, tags: p.tags,
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cfdblog-bookmarks-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (bookmarkIds === null) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-20 rounded-lg" />
        ))}
      </div>
    )
  }

  if (bookmarked.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-4xl" style={{ color: 'var(--border)' }}>⊕</p>
        <p className="mt-3 text-sm font-medium" style={{ color: 'var(--text)' }}>{t(locale, 'bookmarks.empty')}</p>
        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          {t(locale, 'bookmarks.subtitle')}
        </p>
        <Link
          href={`/${locale}`}
          className="mt-5 inline-block rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent)', color: '#08111f' }}
        >
          {t(locale, 'nav.posts')}
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
            style={{ color: 'var(--text-faint)' }}
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(locale, 'bookmarks.searchPlaceholder')}
            className="min-h-11 w-full rounded-md py-2 pl-8 pr-3 text-sm focus:outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="mono text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
            {filtered.length} / {bookmarked.length}
          </span>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            title={t(locale, 'bookmarks.export')}
          >
            <Download className="h-3.5 w-3.5" /> {t(locale, 'bookmarks.export')}
          </button>
        </div>
      </div>

      {tagCounts.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {tagCounts.map(([tag, count]) => {
            const isActive = activeTag === tag
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setActiveTag(isActive ? null : tag)}
                className="mono inline-flex min-h-11 items-center rounded-full px-2.5 py-1 text-[11px] transition-colors"
                style={{
                  background: isActive ? 'var(--accent-glow)' : 'var(--surface)',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {tag} <span style={{ color: 'var(--text-faint)' }}>·{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
          {t(locale, 'bookmarks.noMatch')}
        </p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {filtered.map((post) => (
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
                      <Link key={tag} href={`/${locale}/tags/${encodeURIComponent(tag)}`} className="tag-pill-sm">
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
                aria-label={`${t(locale, 'bookmarks.remove')}: ${post.title}`}
                title={t(locale, 'bookmarks.remove')}
              >
                <BookmarkX className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
