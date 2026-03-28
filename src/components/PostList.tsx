'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { getAllDynamicPosts, type DynamicPost } from '@/lib/dynamic-posts'
import { getBookmarks } from '@/components/BookmarkButton'

interface StaticPostItem {
  id: string
  title: string
  date: string
  description: string
  tags: string[]
  readingTime?: string
  url: string
  isDynamic: false
}

interface DynamicPostItem {
  id: string
  title: string
  date: string
  description: string
  tags: string[]
  isDynamic: true
}

type PostItem = StaticPostItem | DynamicPostItem

const READ_POSTS_KEY = 'cfd-lab-read-posts'

function getReadPosts(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_POSTS_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch { return new Set() }
}

export function PostList({ staticPosts }: { staticPosts: StaticPostItem[] }) {
  const [mounted, setMounted] = useState(false)
  const [dynamicPosts, setDynamicPosts] = useState<DynamicPostItem[]>([])
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<'newest' | 'oldest'>('newest')
  const [showAllTags, setShowAllTags] = useState(false)
  const [readPosts, setReadPosts] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const TAG_VISIBLE_LIMIT = 12

  useEffect(() => {
    setMounted(true)
    const dyn = getAllDynamicPosts().map((p): DynamicPostItem => ({
      id: p.id,
      title: p.title,
      date: p.date,
      description: p.description,
      tags: p.tags,
      isDynamic: true,
    }))
    setDynamicPosts(dyn)
    setReadPosts(getReadPosts())
    setBookmarks(getBookmarks())
  }, [])

  // Use only static posts until client mounts to avoid hydration mismatch
  const all: PostItem[] = useMemo(() => (
    [...staticPosts, ...(mounted ? dynamicPosts : [])].sort(
      (a, b) => {
        const diff = new Date(b.date).getTime() - new Date(a.date).getTime()
        return sortMode === 'newest' ? diff : -diff
      }
    )
  ), [staticPosts, dynamicPosts, mounted, sortMode])

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const post of all) {
      for (const tag of post.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [all])

  const filtered = activeTag ? all.filter((p) => p.tags.includes(activeTag)) : all

  const titleStyle = { fontFamily: 'var(--font-display)' }

  if (all.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-4xl" style={{ color: 'var(--border)' }}>∅</p>
        <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>No posts published yet.</p>
      </div>
    )
  }

  // Group by year
  const grouped: Record<string, PostItem[]> = {}
  for (const post of filtered) {
    const year = new Date(post.date).getFullYear().toString()
    if (!grouped[year]) grouped[year] = []
    grouped[year].push(post)
  }
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  const staticCount = staticPosts.length
  const totalCount = all.length

  return (
    <div>
      {/* Tag filter bar + sort toggle */}
      {allTags.length > 0 && (
        <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="-mx-1 flex flex-wrap gap-1.5 px-1 flex-1">
          <button
            onClick={() => setActiveTag(null)}
            className="rounded-full px-3 py-1 text-xs font-medium transition-colors duration-100"
            style={{
              background: activeTag === null ? 'var(--accent)' : 'var(--surface)',
              color: activeTag === null ? '#08111f' : 'var(--text-muted)',
              border: `1px solid ${activeTag === null ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            All
          </button>
          {(showAllTags ? allTags : allTags.slice(0, TAG_VISIBLE_LIMIT)).map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors duration-100"
              style={{
                background: activeTag === tag ? 'var(--accent)' : 'var(--surface)',
                color: activeTag === tag ? '#08111f' : 'var(--text-muted)',
                border: `1px solid ${activeTag === tag ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {tag}
              <span
                className="rounded-full px-1 text-[9px] font-semibold tabular-nums"
                style={{
                  background: activeTag === tag ? 'rgba(0,0,0,0.15)' : 'var(--border)',
                  color: activeTag === tag ? '#08111f' : 'var(--text-faint)',
                }}
              >
                {count}
              </span>
            </button>
          ))}
          {allTags.length > TAG_VISIBLE_LIMIT && (
            <button
              onClick={() => setShowAllTags((s) => !s)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors duration-100"
              style={{ color: 'var(--text-faint)', border: '1px solid var(--border)' }}
            >
              {showAllTags ? 'Show less' : `+${allTags.length - TAG_VISIBLE_LIMIT} more`}
            </button>
          )}
          </div>
          {/* Sort toggle */}
          <div
            className="flex shrink-0 items-center gap-0.5 rounded-md p-0.5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            {(['newest', 'oldest'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className="rounded px-2 py-1 text-[10px] font-medium transition-colors duration-100"
                style={{
                  background: sortMode === mode ? 'var(--surface-hover)' : 'transparent',
                  color: sortMode === mode ? 'var(--text)' : 'var(--text-muted)',
                }}
              >
                {mode === 'newest' ? '↓ New' : '↑ Old'}
              </button>
            ))}
          </div>
        </div>
        </div>
      )}

      {activeTag && (
        <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <span>Filtering by</span>
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
          >
            #{activeTag}
          </span>
          <button
            onClick={() => setActiveTag(null)}
            className="link-hover-text text-xs transition-colors duration-100"
            style={{ color: 'var(--text-faint)' }}
          >
            Clear ×
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No posts tagged <strong style={{ color: 'var(--text)' }}>#{activeTag}</strong>.
          </p>
        </div>
      )}

      {years.map((year) => (
        <div key={year} className="mb-10">
          <div
            className="sticky top-14 z-10 mb-4 -mx-4 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest sm:-mx-6 sm:px-6"
            style={{ color: 'var(--text-faint)', background: 'var(--bg)' }}
          >
            {year}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {grouped[year].map((post) => {
              const href = post.isDynamic ? `/read?id=${post.id}` : post.url
              const isNew = !post.isDynamic && (Date.now() - new Date(post.date).getTime()) < 7 * 24 * 60 * 60 * 1000
              const isRead = mounted && readPosts.has(post.id)
              const isBookmarked = mounted && bookmarks.has(post.id)
              return (
                <div key={post.id} className="group rounded-lg px-3 py-6 -mx-3 transition-colors duration-100 hover:bg-[var(--surface)]">
                  <h2 className="mb-1.5 flex items-start justify-between gap-2 text-xl font-semibold leading-snug tracking-tight" style={titleStyle}>
                    <span className="flex items-start gap-2">
                    <Link
                      href={href}
                      className="link-hover-accent"
                    >
                      {post.title}
                    </Link>
                    {isNew && (
                      <span className="mt-1.5 shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ background: 'var(--accent)', color: '#08111f' }}>
                        New
                      </span>
                    )}
                    {isRead && (
                      <span className="mt-2 shrink-0 text-[10px]" style={{ color: 'var(--text-faint)' }} title="You've read this">✓</span>
                    )}
                    {isBookmarked && (
                      <span className="mt-2 shrink-0 text-[10px]" style={{ color: 'var(--accent)' }} title="Bookmarked">⊕</span>
                    )}
                    </span>
                    <span
                      className="mt-1 shrink-0 text-base opacity-0 transition-opacity duration-100 group-hover:opacity-100"
                      style={{ color: 'var(--accent)' }}
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </h2>
                  <div className="mb-2.5 flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <time dateTime={post.date}>
                      {format(post.isDynamic ? new Date(post.date) : parseISO(post.date), 'MMM d')}
                    </time>
                    {!post.isDynamic && post.readingTime && (
                      <>
                        <span style={{ color: 'var(--border)' }}>·</span>
                        <span>{post.readingTime}</span>
                      </>
                    )}
                    {post.isDynamic && (
                      <>
                        <span style={{ color: 'var(--border)' }}>·</span>
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium" style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>Draft</span>
                      </>
                    )}
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {post.description}
                  </p>
                  {post.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/tags/${encodeURIComponent(tag)}`}
                          className="tag-pill-sm"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {totalCount > 0 && (
        <p className="mt-4 text-xs tabular-nums" style={{ color: 'var(--text-faint)' }}>
          {activeTag ? `${filtered.length} of ${totalCount}` : totalCount} post{totalCount !== 1 ? 's' : ''}
          {!activeTag && mounted && dynamicPosts.length > 0 && ` (${staticCount} published + ${dynamicPosts.length} draft)`}
          {activeTag && ` · #${activeTag}`}
        </p>
      )}
    </div>
  )
}
