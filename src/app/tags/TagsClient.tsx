'use client'

import { useState } from 'react'
import Link from 'next/link'

type SortMode = 'count' | 'alpha'

export function TagsClient({ tags }: { tags: [string, number][] }) {
  const [sort, setSort] = useState<SortMode>('count')

  const sorted = [...tags].sort((a, b) =>
    sort === 'count' ? b[1] - a[1] : a[0].localeCompare(b[0])
  )

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
            {tags.length} tag{tags.length !== 1 ? 's' : ''} across all posts
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
      {tags.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tags found.</p>
      )}
      {tags.length > 0 && (() => {
        const maxCount = Math.max(...tags.map(([, c]) => c))
        const minCount = Math.min(...tags.map(([, c]) => c))
        return (
          <div className="flex flex-wrap items-baseline gap-2">
            {sorted.map(([tag, count]) => {
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
