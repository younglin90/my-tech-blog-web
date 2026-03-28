'use client'

import { useEffect, useState } from 'react'
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
  const all: PostItem[] = [...staticPosts, ...(mounted ? dynamicPosts : [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

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
  for (const post of all) {
    const year = new Date(post.date).getFullYear().toString()
    if (!grouped[year]) grouped[year] = []
    grouped[year].push(post)
  }
  const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a))

  return (
    <div>
      {years.map((year) => (
        <div key={year} className="mb-10">
          <div
            className="mb-4 text-xs font-semibold uppercase tracking-widest"
            style={{ color: 'var(--text-faint)' }}
          >
            {year}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {grouped[year].map((post) => {
              const href = post.isDynamic ? `/read?id=${post.id}` : post.url
              return (
                <div key={post.id} className="group py-7">
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
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
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
    </div>
  )
}
