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
      <div className="flex flex-wrap gap-2">
        {sorted.map(([tag, count]) => (
          <Link
            key={tag}
            href={`/tags/${encodeURIComponent(tag)}`}
            className="tag-pill flex items-center gap-1.5"
          >
            {tag}
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: 'var(--border)', color: 'var(--text-muted)' }}
            >
              {count}
            </span>
          </Link>
        ))}
        {tags.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No tags found.</p>
        )}
      </div>
    </div>
  )
}
