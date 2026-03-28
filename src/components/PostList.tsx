'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { getAllDynamicPosts, type DynamicPost } from '@/lib/dynamic-posts'

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

export function PostList({ staticPosts }: { staticPosts: StaticPostItem[] }) {
  const [mounted, setMounted] = useState(false)
  const [dynamicPosts, setDynamicPosts] = useState<DynamicPostItem[]>([])
  const [activeTag, setActiveTag] = useState<string | null>(null)

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
  }, [])

  // Use only static posts until client mounts to avoid hydration mismatch
  const all: PostItem[] = useMemo(() => (
    [...staticPosts, ...(mounted ? dynamicPosts : [])].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
  ), [staticPosts, dynamicPosts, mounted])

  const allTags = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const post of all) {
      for (const tag of post.tags) {
        counts[tag] = (counts[tag] ?? 0) + 1
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([tag]) => tag)
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
      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="mb-6 -mx-1 flex flex-wrap gap-1.5 px-1">
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
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className="rounded-full px-3 py-1 text-xs font-medium transition-colors duration-100"
              style={{
                background: activeTag === tag ? 'var(--accent)' : 'var(--surface)',
                color: activeTag === tag ? '#08111f' : 'var(--text-muted)',
                border: `1px solid ${activeTag === tag ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {tag}
            </button>
          ))}
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
            className="sticky top-0 z-10 mb-4 -mx-4 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest sm:-mx-6 sm:px-6"
            style={{ color: 'var(--text-faint)', background: 'var(--bg)' }}
          >
            {year}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {grouped[year].map((post) => {
              const href = post.isDynamic ? `/read?id=${post.id}` : post.url
              return (
                <div key={post.id} className="group rounded-lg px-3 py-6 -mx-3 transition-colors duration-100 hover:bg-[var(--surface)]">
                  <h2 className="mb-1.5 text-xl font-semibold leading-snug tracking-tight" style={titleStyle}>
                    <Link
                      href={href}
                      className="link-hover-accent"
                    >
                      {post.title}
                    </Link>
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
