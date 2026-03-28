'use client'

import { useState } from 'react'
import Link from 'next/link'

type SortMode = 'count' | 'alpha'

export function TagsClient({ tags }: { tags: [string, number][] }) {
  const [sort, setSort] = useState<SortMode>('count')
  const [filter, setFilter] = useState('')

  const q = filter.toLowerCase()
  const sorted = [...tags]
    .filter(([tag]) => !q || tag.toLowerCase().includes(q))
    .sort((a, b) => sort === 'count' ? b[1] - a[1] : a[0].localeCompare(b[0]))

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="mb-1 text-3xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}
          >
            Tags
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {sorted.length !== tags.length
              ? `${sorted.length} of ${tags.length} tags`
              : `${tags.length} tag${tags.length !== 1 ? 's' : ''} across all posts`}
          </p>
        </div>
        <div
          className="flex items-center gap-1 rounded-md p-0.5"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          {(['count', 'alpha'] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSort(mode)}
              className="rounded px-2.5 py-1 text-xs font-medium transition-colors duration-100"
              style={{
                background: sort === mode ? 'var(--surface-hover)' : 'transparent',
                color: sort === mode ? 'var(--text)' : 'var(--text-muted)',
              }}
            >
              {mode === 'count' ? 'By count' : 'A–Z'}
            </button>
          ))}
        </div>
      </div>
      {tags.length > 6 && (
        <input
          type="search"
          placeholder="Filter tags…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mb-5 w-full rounded-md px-3 py-2 text-sm focus:outline-none"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
      )}
      {sorted.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tags match &ldquo;{filter}&rdquo;.</p>
      )}
      {sorted.length > 0 && (() => {
        if (sort === 'alpha') {
          // Group by first letter
          const groups: Record<string, [string, number][]> = {}
          sorted.forEach(([tag, count]) => {
            const letter = tag[0].toUpperCase()
            if (!groups[letter]) groups[letter] = []
            groups[letter].push([tag, count])
          })
          return (
            <div className="space-y-6">
              {Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([letter, items]) => (
                <div key={letter}>
                  <p className="mb-2.5 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)', opacity: 0.7 }}>
                    {letter}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map(([tag, count]) => (
                      <Link
                        key={tag}
                        href={`/tags/${encodeURIComponent(tag)}`}
                        className="tag-pill flex items-center gap-1.5"
                        title={`${count} post${count !== 1 ? 's' : ''}`}
                      >
                        {tag}
                        <span
                          className="rounded-full px-1.5 py-0.5 font-semibold"
                          style={{ background: 'var(--border)', color: 'var(--text-muted)', fontSize: '0.625rem' }}
                        >
                          {count}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        }

        const maxCount = Math.max(...sorted.map(([, c]) => c))
        const minCount = Math.min(...sorted.map(([, c]) => c))
        return (
          <div className="flex flex-wrap items-baseline gap-2">
            {sorted.map(([tag, count]: [string, number]) => {
              const ratio = maxCount === minCount ? 0.5 : (count - minCount) / (maxCount - minCount)
              const fontSize = 0.72 + ratio * 0.36 // 0.72rem → 1.08rem
              const opacity = 0.65 + ratio * 0.35  // 0.65 → 1.0
              return (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="tag-pill flex items-center gap-1.5 transition-opacity duration-100 hover:opacity-100"
                  style={{ fontSize: `${fontSize}rem`, opacity }}
                  title={`${count} post${count !== 1 ? 's' : ''}`}
                >
                  {tag}
                  <span
                    className="rounded-full px-1.5 py-0.5 font-semibold"
                    style={{ background: 'var(--border)', color: 'var(--text-muted)', fontSize: '0.625rem' }}
                  >
                    {count}
                  </span>
                </Link>
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}
