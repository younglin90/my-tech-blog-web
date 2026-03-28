'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Search as SearchIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { allPosts } from 'contentlayer/generated'

export function Search() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [activeIdx, setActiveIdx] = React.useState(0)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  React.useEffect(() => {
    setActiveIdx(0)
  }, [query])

  const filteredPosts = allPosts
    .filter((post) => !post.draft)
    .filter(
      (post) =>
        post.title.toLowerCase().includes(query.toLowerCase()) ||
        post.description.toLowerCase().includes(query.toLowerCase()),
    )
    .slice(0, 6)

  const onSelect = (url: string) => {
    setOpen(false)
    setQuery('')
    router.push(url)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, filteredPosts.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && filteredPosts[activeIdx]) {
      onSelect(filteredPosts[activeIdx].url)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors duration-100"
        style={{
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          background: 'transparent',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
      >
        <SearchIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Search</span>
        <kbd
          className="hidden rounded px-1.5 py-0.5 text-[10px] font-medium sm:inline"
          style={{ background: 'var(--surface)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}
        >
          ⌘K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[18vh]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0"
              style={{ background: '#08111f' }}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-lg overflow-hidden"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '0.75rem',
                boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
              }}
            >
              {/* Input */}
              <div
                className="flex items-center gap-3 px-4"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <SearchIcon className="h-4 w-4 shrink-0" style={{ color: 'var(--text-muted)' }} />
                <input
                  autoFocus
                  placeholder="Search posts…"
                  className="h-12 w-full border-none bg-transparent text-sm focus:outline-none"
                  style={{ color: 'var(--text)' }}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    clear
                  </button>
                )}
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto p-1.5">
                {filteredPosts.length > 0 ? (
                  filteredPosts.map((post, i) => (
                    <button
                      key={post.slug}
                      onClick={() => onSelect(post.url)}
                      onMouseEnter={() => setActiveIdx(i)}
                      className="flex w-full flex-col rounded-lg px-4 py-3 text-left transition-colors duration-75"
                      style={{
                        background: i === activeIdx ? 'var(--surface-hover)' : 'transparent',
                      }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: i === activeIdx ? 'var(--accent)' : 'var(--text)' }}
                      >
                        {post.title}
                      </span>
                      <span className="mt-0.5 text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                        {post.description}
                      </span>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    {query ? `No results for "${query}"` : 'Start typing to search…'}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              {filteredPosts.length > 0 && (
                <div
                  className="flex items-center gap-3 px-4 py-2 text-[10px]"
                  style={{ borderTop: '1px solid var(--border)', color: 'var(--text-faint)' }}
                >
                  <span>↑↓ navigate</span>
                  <span>↵ open</span>
                  <span>esc close</span>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
