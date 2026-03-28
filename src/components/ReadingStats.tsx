'use client'

import { useEffect, useState } from 'react'

const READ_POSTS_KEY = 'cfd-lab-read-posts'
const BOOKMARKS_KEY = 'cfd-lab-bookmarks'

interface ReadingStatsProps {
  posts: { id: string; readingTime?: string }[]
}

export function ReadingStats({ posts }: ReadingStatsProps) {
  const [stats, setStats] = useState<{ read: number; bookmarked: number; minutesRead: number } | null>(null)

  useEffect(() => {
    try {
      const readRaw = localStorage.getItem(READ_POSTS_KEY)
      const readIds: string[] = readRaw ? JSON.parse(readRaw) : []
      const bookmarkRaw = localStorage.getItem(BOOKMARKS_KEY)
      const bookmarkIds: string[] = bookmarkRaw ? JSON.parse(bookmarkRaw) : []

      const minutesRead = posts
        .filter((p) => readIds.includes(p.id))
        .reduce((sum, p) => {
          const mins = parseInt(p.readingTime ?? '0', 10)
          return sum + (isNaN(mins) ? 0 : mins)
        }, 0)

      setStats({ read: readIds.length, bookmarked: bookmarkIds.length, minutesRead })
    } catch {
      setStats({ read: 0, bookmarked: 0, minutesRead: 0 })
    }
  }, [posts])

  if (!stats || (stats.read === 0 && stats.bookmarked === 0)) return null

  const items = [
    { label: 'Posts read', value: stats.read.toString() },
    { label: 'Bookmarked', value: stats.bookmarked.toString() },
    { label: 'Time invested', value: stats.minutesRead >= 60 ? `${Math.round(stats.minutesRead / 60)}h` : `${stats.minutesRead}m` },
  ]

  return (
    <section className="mb-10">
      <h2
        className="mb-4 text-xl font-semibold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
      >
        Your Reading
      </h2>
      <div className="grid grid-cols-3 gap-3">
        {items.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg p-4 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div
              className="text-2xl font-bold tabular-nums"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}
            >
              {value}
            </div>
            <div className="mt-0.5 text-xs" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px]" style={{ color: 'var(--text-faint)' }}>
        Stored locally in your browser
      </p>
    </section>
  )
}
