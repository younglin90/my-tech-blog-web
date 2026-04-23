'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search as SearchIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { localePathPrefix, t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'
import mathManifest from '@/lib/math-manifest.json'
import { dedupePostsForLocale, loadPostIndexClient, type PostIndexItem } from '@/lib/post-index'

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} style={{ background: 'var(--accent-glow)', color: 'var(--accent)', borderRadius: '0.2em' }}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}

export function Search() {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [activeIdx, setActiveIdx] = React.useState(0)
  const [isMac, setIsMac] = React.useState(false)
  const [recentlyRead, setRecentlyRead] = React.useState<string[]>([])
  const [indexItems, setIndexItems] = React.useState<PostIndexItem[]>([])
  const [indexLoading, setIndexLoading] = React.useState(false)
  const [indexError, setIndexError] = React.useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

  React.useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'))
    // Pre-fill and open search if ?q= is in the URL (client-side only)
    const params = new URLSearchParams(window.location.search)
    const q = params.get('q')
    if (q) {
      setQuery(q)
      setOpen(true)
    }
    // Load recently read post IDs from localStorage
    try {
      const raw = localStorage.getItem('cfd-lab-read-posts')
      setRecentlyRead(raw ? JSON.parse(raw) : [])
    } catch {}
  }, [])

  React.useEffect(() => {
    if (!open || indexItems.length > 0 || indexLoading) return
    setIndexLoading(true)
    setIndexError(null)
    loadPostIndexClient()
      .then((payload) => setIndexItems(payload.items as PostIndexItem[]))
      .catch((e: unknown) => setIndexError(e instanceof Error ? e.message : 'failed to load index'))
      .finally(() => setIndexLoading(false))
  }, [open, indexItems.length, indexLoading])

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const tag = (e.target as HTMLElement).tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA') return
        e.preventDefault()
        setOpen(true)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  React.useEffect(() => {
    setActiveIdx(0)
  }, [query])

  // 검색어 변경 시 디바운스 후 노결과 쿼리 트래킹 (콘텐츠 갭 분석용)
  React.useEffect(() => {
    if (!query || query.length < 2) return
    if (indexItems.length === 0) return
    const timer = setTimeout(() => {
      const q = query.toLowerCase().replace(/^#/, '')
      const has = indexItems.some(
        (p) => !p.draft && (p.title.toLowerCase().includes(q) || (p.tags ?? []).some((t) => t.toLowerCase().includes(q)))
      )
      if (!has) trackEvent('search-no-results', { query })
    }, 1500)
    return () => clearTimeout(timer)
  }, [query, indexItems])

  // locale 기준 dedupe: 현재 locale 우선, 없으면 ko fallback. 같은 slug 1개만 유지.
  const publishedPosts = React.useMemo(() => {
    if (indexItems.length === 0) return []
    return dedupePostsForLocale(indexItems, locale)
  }, [indexItems, locale])

  // Compute top tags for suggestion chips when search is empty
  const topTags = React.useMemo(() => {
    const counts: Record<string, number> = {}
    publishedPosts.forEach((p) => (p.tags ?? []).forEach((t) => { counts[t] = (counts[t] ?? 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t)
  }, [publishedPosts])

  const isTagQuery = query.startsWith('#')
  const isMathQuery = query.includes('\\') || /^(nabla|partial|rho|mu|nu|tau|sigma|gamma|delta|alpha|beta|theta|omega|phi|psi|epsilon)$/i.test(query.trim())
  const q = isTagQuery ? query.slice(1).toLowerCase() : query.toLowerCase()
  const mathToken = isMathQuery ? query.trim().replace(/^\\/, '').toLowerCase() : null

  // Math 검색: math-manifest의 token에 매칭되는 포스트 slug 집합
  const mathSlugs = React.useMemo(() => {
    if (!mathToken) return new Set<string>()
    const set = new Set<string>()
    for (const entry of mathManifest as Array<{ slug: string; tokens: string[] }>) {
      if (entry.tokens.some((t) => t.toLowerCase().includes(mathToken))) set.add(entry.slug)
    }
    return set
  }, [mathToken])

  const filteredPosts = q
    ? publishedPosts
        .map((post) => {
          if (isTagQuery) {
            const tagMatches = (post.tags ?? []).filter((t) => t.toLowerCase().includes(q)).length
            return { post, score: tagMatches * 3 }
          }
          if (mathToken) {
            return { post, score: mathSlugs.has(post.slug) ? 5 : 0 }
          }
          const titleMatch = post.title.toLowerCase().includes(q)
          const descMatch = post.description.toLowerCase().includes(q)
          const tagMatches = (post.tags ?? []).filter((t) => t.toLowerCase().includes(q)).length
          const score = (titleMatch ? 3 : 0) + (descMatch ? 1 : 0) + tagMatches * 2
          return { post, score }
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8)
        .map(({ post }) => post)
    : (() => {
        // Prefer recently read posts, fall back to recent
        const read = publishedPosts.filter((p) => recentlyRead.includes(p.slug))
        if (read.length >= 3) return read.slice(0, 5)
        return publishedPosts
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5)
      })()

  const onSelect = (url: string) => {
    if (query) trackEvent('search-select', { query, url })
    setOpen(false)
    setQuery('')
    router.push(url)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIdx((i) => (i + 1) % filteredPosts.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIdx((i) => (i - 1 + filteredPosts.length) % filteredPosts.length)
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
        className="search-trigger flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors duration-100"
        style={{
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
          background: 'transparent',
        }}
      >
        <SearchIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t(locale, 'nav.search')}</span>
        <kbd
          className="hidden rounded px-1.5 py-0.5 text-[10px] font-medium sm:inline"
          style={{ background: 'var(--surface)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}
        >
          {isMac ? '⌘K' : 'Ctrl K'}
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
                  placeholder={t(locale, 'search.placeholder')}
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

              {/* Tag search mode indicator */}
              {isTagQuery && q && (
                <div className="px-4 py-1.5 text-[10px]" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                  Filtering by tag: <strong>#{q}</strong>
                </div>
              )}
              {mathToken && (
                <div className="px-4 py-1.5 text-[10px]" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                  Math symbol: <strong>\{mathToken}</strong> — {mathSlugs.size} post{mathSlugs.size !== 1 ? 's' : ''}
                </div>
              )}

              {/* Screen reader announcements */}
              <p className="sr-only" aria-live="polite" aria-atomic="true">
                {q && filteredPosts.length === 0
                  ? `No results for ${query}`
                  : q && filteredPosts.length > 0
                  ? `${filteredPosts.length} result${filteredPosts.length !== 1 ? 's' : ''} for ${query}`
                  : ''}
              </p>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto p-1.5" role="listbox" aria-label="Search results">
                {indexLoading && (
                  <p className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    Loading search index...
                  </p>
                )}
                {indexError && (
                  <p className="px-4 py-3 text-xs" style={{ color: 'var(--error)' }}>
                    Search index error: {indexError}
                  </p>
                )}
                {!q && topTags.length > 0 && (
                  <div className="px-3 pb-2 pt-1.5">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                      Popular Tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {topTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setQuery(`#${tag}`)}
                          className="rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors duration-75"
                          style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!q && filteredPosts.length > 0 && (
                <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                  {recentlyRead.length >= 3 ? 'Recently Read' : 'Recent'}
                </p>
              )}
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
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className="text-sm font-medium"
                          style={{ color: i === activeIdx ? 'var(--accent)' : 'var(--text)' }}
                        >
                          <Highlight text={post.title} query={q} />
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          {post.readingTime && (
                            <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
                              {post.readingTime}
                            </span>
                          )}
                          <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
                            {format(parseISO(post.date), 'MMM yyyy')}
                          </span>
                        </div>
                      </div>
                      <span className="mt-0.5 text-xs line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                        <Highlight text={post.description} query={q} />
                      </span>
                      {post.tags && post.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded px-1.5 py-0.5 text-[9px] font-medium"
                              style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    {query ? `${t(locale, 'search.noResults')}: "${query}"` : t(locale, 'search.placeholder')}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              {filteredPosts.length > 0 && (
                <div
                  className="flex items-center justify-between px-4 py-2 text-[10px]"
                  style={{ borderTop: '1px solid var(--border)', color: 'var(--text-faint)' }}
                >
                  <div className="flex items-center gap-3">
                    <span>↑↓ navigate</span>
                    <span>↵ open</span>
                    <span>esc close</span>
                  </div>
                  {query && (
                    <span className="tabular-nums">{filteredPosts.length} {t(locale, 'search.results')}</span>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
