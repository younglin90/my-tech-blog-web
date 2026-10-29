'use client'

import * as React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Search as SearchIcon } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { localePathPrefix, t } from '@/lib/i18n'
import { seriesTitle } from '@/lib/series-title'
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
  const [recentQueries, setRecentQueries] = React.useState<string[]>([])
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
    // Load recent search queries
    try {
      const raw = localStorage.getItem('cfd-lab-recent-searches')
      const arr = raw ? JSON.parse(raw) : []
      setRecentQueries(Array.isArray(arr) ? arr.filter((s) => typeof s === 'string').slice(0, 5) : [])
    } catch {}
  }, [])

  const persistRecentQuery = React.useCallback((q: string) => {
    const trimmed = q.trim()
    if (!trimmed || trimmed.length < 2) return
    setRecentQueries((prev) => {
      const next = [trimmed, ...prev.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5)
      try { localStorage.setItem('cfd-lab-recent-searches', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const clearRecentQueries = () => {
    setRecentQueries([])
    try { localStorage.removeItem('cfd-lab-recent-searches') } catch {}
  }

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

  // locale 기준 dedupe: 현재 locale 우선, 없으면 ko fallback. 같은 slug 1개만 유지.
  const publishedPosts = React.useMemo(() => {
    if (indexItems.length === 0) return []
    return dedupePostsForLocale(indexItems, locale)
  }, [indexItems, locale])

  // ko fallback 항목의 url은 /ko/... 이므로 현재 locale 경로로 재작성 (locale 전환 방지)
  const postHref = React.useCallback(
    (post: PostIndexItem) => (post.locale === locale ? post.url : `/${locale}/posts/${post.slug}`),
    [locale]
  )

  // Compute top tags for suggestion chips when search is empty
  const topTags = React.useMemo(() => {
    const counts: Record<string, number> = {}
    publishedPosts.forEach((p) => (p.tags ?? []).forEach((t) => { counts[t] = (counts[t] ?? 0) + 1 }))
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t)
  }, [publishedPosts])

  const isTagQuery = query.startsWith('#')
  const isSeriesQuery = /^series:/i.test(query)
  const isMathQuery = query.includes('\\') || /^(nabla|partial|rho|mu|nu|tau|sigma|gamma|delta|alpha|beta|theta|omega|phi|psi|epsilon)$/i.test(query.trim())
  const q = isTagQuery
    ? query.slice(1).toLowerCase()
    : isSeriesQuery
      ? query.replace(/^series:/i, '').trim().toLowerCase()
      : query.toLowerCase()
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
          if (isSeriesQuery) {
            const series = post.series
              ? `${post.series} ${seriesTitle(post.series, locale)}`.toLowerCase()
              : ''
            // 빈 q이면 series 있는 모든 포스트, 그 외엔 substring 매칭
            const match = q ? series.includes(q) : Boolean(series)
            // 같은 시리즈 안에선 seriesOrder 오름차순(낮은 번호 먼저) 위해 score를 살짝 조정
            const orderBoost = post.seriesOrder ? -post.seriesOrder * 0.001 : 0
            return { post, score: match ? 4 + orderBoost : 0 }
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
    if (query) {
      persistRecentQuery(query)
    }
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
      onSelect(postHref(filteredPosts[activeIdx]))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="search-trigger flex min-h-11 min-w-11 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2 py-1.5 text-sm transition-colors duration-100"
        style={{ color: 'var(--text-muted)', background: 'transparent' }}
        aria-label={t(locale, 'nav.search')}
      >
        <SearchIcon className="h-4 w-4" />
        {/* 전역 kbd 규칙(display: inline-block)이 유틸리티보다 강해 바깥 span으로 숨긴다 */}
        <span className="hidden lg:inline">
          <kbd className="text-[10px]">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
        </span>
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
              style={{ background: 'var(--on-accent)' }}
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
                    {t(locale, 'search.clear')}
                  </button>
                )}
              </div>

              {/* Tag search mode indicator */}
              {isTagQuery && q && (
                <div className="px-4 py-1.5 text-[10px]" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                  {t(locale, 'search.filterByTag')} <strong>#{q}</strong>
                </div>
              )}
              {isSeriesQuery && (
                <div className="px-4 py-1.5 text-[10px]" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                  {t(locale, 'search.filterBySeries')} <strong>{q || '*'}</strong>
                </div>
              )}
              {mathToken && (
                <div className="px-4 py-1.5 text-[10px]" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>
                  {t(locale, 'search.mathSymbol')} <strong>\{mathToken}</strong> ·{' '}
                  {t(locale, 'search.matches', { count: String(mathSlugs.size) })}
                </div>
              )}

              {/* Screen reader announcements */}
              <p className="sr-only" aria-live="polite" aria-atomic="true">
                {q && filteredPosts.length === 0
                  ? t(locale, 'search.srNoResults', { query })
                  : q && filteredPosts.length > 0
                  ? t(locale, 'search.srResults', { count: String(filteredPosts.length), query })
                  : ''}
              </p>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto p-1.5" role="listbox" aria-label={t(locale, 'search.resultsAria')}>
                {indexLoading && (
                  <p className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {t(locale, 'search.loadingIndex')}
                  </p>
                )}
                {indexError && (
                  <p className="px-4 py-3 text-xs" style={{ color: 'var(--error)' }}>
                    {t(locale, 'search.indexError', { error: indexError })}
                  </p>
                )}
                {!q && recentQueries.length > 0 && (
                  <div className="px-3 pb-1 pt-1.5">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                        {t(locale, 'search.recentQueries')}
                      </p>
                      <button
                        onClick={clearRecentQueries}
                        className="text-[10px]"
                        style={{ color: 'var(--text-faint)', textDecoration: 'underline' }}
                      >
                        {t(locale, 'search.clearRecent')}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentQueries.map((rq) => (
                        <button
                          key={rq}
                          onClick={() => setQuery(rq)}
                          className="mono inline-flex min-h-11 items-center rounded-full px-2.5 py-1 text-[10px] transition-colors duration-75"
                          style={{ background: 'var(--surface-hover)', color: 'var(--text)', border: '1px solid var(--border)' }}
                        >
                          {rq}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!q && topTags.length > 0 && (
                  <div className="px-3 pb-2 pt-1.5">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                      {t(locale, 'search.popularTags')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {topTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setQuery(`#${tag}`)}
                          className="inline-flex min-h-11 items-center rounded-full px-2.5 py-1 text-[10px] font-medium transition-colors duration-75"
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
                  {recentlyRead.length >= 3 ? t(locale, 'search.recentlyRead') : t(locale, 'search.recent')}
                </p>
              )}
              {filteredPosts.length > 0 ? (
                  filteredPosts.map((post, i) => (
                    <button
                      key={post.slug}
                      onClick={() => onSelect(postHref(post))}
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
                      {(post.series || (post.tags && post.tags.length > 0)) && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          {post.series && (
                            <span
                              className="mono rounded px-1.5 py-0.5 text-[9px] font-semibold"
                              style={{ background: 'var(--accent-glow)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
                            >
                              {seriesTitle(post.series, locale)}
                              {post.seriesOrder ? ` · ${String(post.seriesOrder).padStart(2, '0')}` : ''}
                            </span>
                          )}
                          {post.tags?.slice(0, 3).map((tag) => (
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
                    <span>↑↓ {t(locale, 'search.navigate')}</span>
                    <span>↵ {t(locale, 'search.open')}</span>
                    <span>esc {t(locale, 'search.close')}</span>
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
