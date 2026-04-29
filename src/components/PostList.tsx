'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { getAllDynamicPosts } from '@/lib/dynamic-posts'
import { getBookmarks } from '@/components/BookmarkButton'
import { dayMeta } from '@/lib/day-meta'
import { localePathPrefix, t } from '@/lib/i18n'
import { dedupePostsForLocale, loadPostIndexClient, type PostIndexItem } from '@/lib/post-index'

interface StaticPostItem {
  id: string
  title: string
  date: string
  description: string
  tags: string[]
  readingTime?: string
  url: string
  isDynamic: false
  series?: string
  seriesOrder?: number
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
const PREFS_KEY = 'cfd-lab-list-prefs'
const PAGE_SIZE = 10  // infinite scroll: 스크롤 하단 감지 시 추가 표시 개수

function getReadPosts(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_POSTS_KEY)
    return new Set(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set()
  }
}

function loadPrefs(): { sort: 'newest' | 'oldest'; compact: boolean } {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    return raw ? { sort: 'newest', compact: false, ...JSON.parse(raw) } : { sort: 'newest', compact: false }
  } catch {
    return { sort: 'newest', compact: false }
  }
}

export function PostList({
  staticPosts,
  initialTotalCount,
  indexPath = '/post-index.json',
}: {
  staticPosts: StaticPostItem[]
  initialTotalCount?: number
  indexPath?: string
}) {
  const [mounted, setMounted] = useState(false)
  const [dynamicPosts, setDynamicPosts] = useState<DynamicPostItem[]>([])
  const [archivePosts, setArchivePosts] = useState<StaticPostItem[] | null>(null)
  const [visibleCount, setVisibleCount] = useState(staticPosts.length)
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [sortMode, setSortMode] = useState<'newest' | 'oldest'>('newest')
  const [compact, setCompact] = useState(false)
  const [showAllTags, setShowAllTags] = useState(false)
  const [readPosts, setReadPosts] = useState<Set<string>>(new Set())
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const TAG_VISIBLE_LIMIT = 8
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // mount: 사용자 설정 + 동적 포스트 + 북마크 로드
  useEffect(() => {
    setMounted(true)
    const prefs = loadPrefs()
    setSortMode(prefs.sort)
    setCompact(prefs.compact)
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

  // mount 후 전체 post-index를 백그라운드 로드 (사용자가 스크롤하면 즉시 사용 가능)
  useEffect(() => {
    let cancelled = false
    loadPostIndexClient(indexPath)
      .then((payload) => {
        if (cancelled) return
        const items = dedupePostsForLocale(payload.items as PostIndexItem[], locale).map(
          (post): StaticPostItem => ({
            id: post.slug,
            title: post.title,
            date: post.date,
            description: post.description,
            tags: post.tags ?? [],
            readingTime: post.readingTime,
            url: locale === post.locale ? post.url : `/${locale}/posts/${post.slug}`,
            isDynamic: false,
          })
        )
        setArchivePosts(items)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [indexPath, locale])

  const updateSort = (mode: 'newest' | 'oldest') => {
    setSortMode(mode)
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ sort: mode, compact }))
    } catch {}
  }

  const updateCompact = (val: boolean) => {
    setCompact(val)
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ sort: sortMode, compact: val }))
    } catch {}
  }

  const sourcePosts = archivePosts ?? staticPosts

  const all: PostItem[] = useMemo(
    () =>
      [...sourcePosts, ...(mounted ? dynamicPosts : [])].sort((a, b) => {
        const diff = new Date(b.date).getTime() - new Date(a.date).getTime()
        return sortMode === 'newest' ? diff : -diff
      }),
    [sourcePosts, dynamicPosts, mounted, sortMode]
  )

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

  // 태그 변경 또는 정렬 변경 시 첫 페이지로 되감기
  useEffect(() => {
    setVisibleCount(Math.min(Math.max(staticPosts.length, PAGE_SIZE), filtered.length || PAGE_SIZE))
  }, [activeTag, sortMode, staticPosts.length, filtered.length])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  // IntersectionObserver: sentinel이 뷰포트에 들어오면 더 로드
  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length))
          }
        }
      },
      { rootMargin: '400px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, filtered.length])

  const totalCount = Math.max(initialTotalCount ?? 0, all.length)

  if (all.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-4xl" style={{ color: 'var(--border)' }}>
          ∅
        </p>
        <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
          {t(locale, 'list.empty')}
        </p>
      </div>
    )
  }

  const totalWords =
    sourcePosts.reduce((sum, p) => {
      const m = p.readingTime?.match(/(\d+)/)
      return sum + (m ? Number(m[1]) * 250 : 0)
    }, 0) || 0

  return (
    <div>
      {/* Tag filter + sort / view mode */}
      {allTags.length > 0 && (
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            <span
              className="mono shrink-0"
              style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.15em', marginRight: 4 }}
            >
              {t(locale, 'list.filter')}
            </span>
            <button
              onClick={() => setActiveTag(null)}
              className="mono inline-flex min-h-11 items-center rounded-md px-2.5 py-1 text-[12px] transition-colors duration-100"
              style={{
                border: '1px solid',
                borderColor: !activeTag ? 'var(--accent)' : 'var(--border)',
                background: !activeTag ? 'var(--accent-glow)' : 'transparent',
                color: !activeTag ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {t(locale, 'list.all')}
            </button>
            {(showAllTags ? allTags : allTags.slice(0, TAG_VISIBLE_LIMIT)).map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                className="mono inline-flex min-h-11 items-center rounded-md px-2.5 py-1 text-[12px] transition-colors duration-100"
                style={{
                  border: '1px solid',
                  borderColor: activeTag === tag ? 'var(--accent)' : 'var(--border)',
                  background: activeTag === tag ? 'var(--accent-glow)' : 'transparent',
                  color: activeTag === tag ? 'var(--accent)' : 'var(--text-muted)',
                }}
                title={t(locale, 'list.tagCount', { count: String(count) })}
              >
                #{tag}
              </button>
            ))}
            {allTags.length > TAG_VISIBLE_LIMIT && (
              <button
                onClick={() => setShowAllTags((s) => !s)}
                className="mono inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2.5 py-1 text-[11px]"
                style={{ color: 'var(--text-faint)', border: '1px solid var(--border)' }}
              >
                {showAllTags ? t(locale, 'list.less') : `+${allTags.length - TAG_VISIBLE_LIMIT}`}
              </button>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <div
              className="mono flex items-center gap-0.5 rounded-md p-0.5"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {(['newest', 'oldest'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSort(mode)}
                  className="inline-flex min-h-11 items-center rounded px-2 py-1 text-[10px] transition-colors duration-100"
                  style={{
                    background: sortMode === mode ? 'var(--surface-hover)' : 'transparent',
                    color: sortMode === mode ? 'var(--text)' : 'var(--text-muted)',
                  }}
                >
                  {mode === 'newest' ? `↓ ${t(locale, 'list.sortNewest')}` : `↑ ${t(locale, 'list.sortOldest')}`}
                </button>
              ))}
            </div>
            <button
              onClick={() => updateCompact(!compact)}
              className="mono inline-flex min-h-11 items-center rounded-md px-2 py-1 text-[10px] transition-colors duration-100"
              style={{
                background: 'var(--surface)',
                border: `1px solid ${compact ? 'var(--accent)' : 'var(--border)'}`,
                color: compact ? 'var(--accent)' : 'var(--text-muted)',
              }}
              title={compact ? t(locale, 'list.viewFull') : t(locale, 'list.viewCompact')}
            >
              {compact ? `≡ ${t(locale, 'list.viewFull')}` : `≡ ${t(locale, 'list.viewCompact')}`}
            </button>
          </div>
        </div>
      )}

      {/* Post list */}
      <div>
        {visible.map((post, idx) => {
          const href = post.isDynamic ? `/read?id=${post.id}` : post.url
          const isNew = !post.isDynamic && Date.now() - new Date(post.date).getTime() < 7 * 24 * 60 * 60 * 1000
          const isRead = mounted && readPosts.has(post.id)
          const isBookmarked = mounted && bookmarks.has(post.id)
          const day = dayMeta(post.date)
          const no = totalCount - (sortMode === 'newest' ? idx : totalCount - 1 - idx)

          if (compact) {
            return (
              <Link
                key={post.id}
                href={href}
                className="group transition-colors duration-100"
                style={{ display: 'block' }}
              >
                <div
                  className="grid gap-3 py-2.5 px-1 -mx-1 rounded"
                  style={{
                    gridTemplateColumns: '50px 46px 88px 1fr auto',
                    alignItems: 'baseline',
                    borderBottom: '1px solid var(--border-soft)',
                  }}
                >
                  <span className="mono tabular" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    #{String(no).padStart(3, '0')}
                  </span>
                  <span className="mono" style={{ fontSize: 11, color: day.colorVar, fontWeight: 600 }}>
                    {day.short}
                  </span>
                  <span className="mono tabular" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {format(post.isDynamic ? new Date(post.date) : parseISO(post.date), 'yyyy.MM.dd')}
                  </span>
                  <span
                    className="truncate"
                    style={{
                      fontSize: 14.5,
                      color: 'var(--text)',
                      fontWeight: 500,
                    }}
                  >
                    {post.title}
                    {isNew && (
                      <span
                        className="ml-2 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                      >
                        {t(locale, 'list.new')}
                      </span>
                    )}
                    {isRead && (
                      <span className="ml-1.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>✓</span>
                    )}
                    {isBookmarked && (
                      <span className="ml-1 text-[10px]" style={{ color: 'var(--accent)' }}>⊕</span>
                    )}
                  </span>
                  <span className="mono tabular" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
                    {post.isDynamic ? t(locale, 'list.draft') : (post as StaticPostItem).readingTime}
                  </span>
                </div>
              </Link>
            )
          }

          const series = (post as any).series as string | undefined
          const seriesOrder = (post as any).seriesOrder as number | undefined
          return (
            <Link key={post.id} href={href} className="post-row group block">
              <div
                className="grid gap-5 px-1 py-5 relative"
                style={{
                  gridTemplateColumns: '92px 1fr',
                  alignItems: 'start',
                  borderBottom: '1px solid var(--border-soft)',
                  borderLeft: `3px solid ${day.colorVar}`,
                  paddingLeft: '12px',
                  marginLeft: '-12px',
                  borderTopLeftRadius: '4px',
                  borderBottomLeftRadius: '4px',
                }}
              >
                <div style={{ paddingTop: 3 }}>
                  <div className="mono tabular" style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.1em' }}>
                    #{String(no).padStart(3, '0')}
                  </div>
                  <div
                    className="mono"
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: day.colorVar,
                      fontWeight: 600,
                      letterSpacing: '0.15em',
                    }}
                  >
                    {day.short}
                  </div>
                  <div className="mono tabular" style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)' }}>
                    {format(post.isDynamic ? new Date(post.date) : parseISO(post.date), 'yyyy.MM.dd')}
                  </div>
                </div>
                <div className="min-w-0">
                  <h2
                    className="display flex items-start gap-2"
                    style={{
                      margin: 0,
                      fontSize: 19,
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.3,
                      color: 'var(--text)',
                    }}
                  >
                    <span className="flex-1">
                      {post.title}
                      {isNew && (
                        <span
                          className="ml-2 align-middle rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{ background: 'var(--accent)', color: 'var(--bg)' }}
                        >
                          {t(locale, 'list.new')}
                        </span>
                      )}
                      {isRead && (
                        <span className="ml-2 align-middle text-[11px]" style={{ color: 'var(--text-faint)' }} title={t(locale, 'list.read')}>
                          ✓
                        </span>
                      )}
                      {isBookmarked && (
                        <span className="ml-1 align-middle text-[11px]" style={{ color: 'var(--accent)' }} title={t(locale, 'list.saved')}>
                          ⊕
                        </span>
                      )}
                      {series && (
                        <span
                          className="ml-2 inline-block align-middle rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            background: 'var(--accent-glow)',
                            color: 'var(--accent)',
                            fontFamily: 'var(--font-mono)',
                          }}
                          title={t(locale, 'list.partOfSeries', { series })}
                        >
                          {series}{seriesOrder ? ` · ${String(seriesOrder).padStart(2, '0')}` : ''}
                        </span>
                      )}
                    </span>
                    <span
                      className="opacity-0 transition-opacity duration-100 group-hover:opacity-100 shrink-0"
                      style={{ color: 'var(--accent)', fontSize: 15, marginTop: 3 }}
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </h2>
                  <p
                    className="line-clamp-2"
                    style={{ margin: '8px 0 10px', fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.6 }}
                  >
                    {post.description}
                  </p>
                  <div
                    className="mono flex flex-wrap items-center gap-x-3 gap-y-1"
                    style={{ fontSize: 11, color: 'var(--text-faint)' }}
                  >
                    {!post.isDynamic && post.readingTime && <span>{post.readingTime}</span>}
                    {post.isDynamic && (
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px]"
                        style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                      >
                        {t(locale, 'list.draft')}
                      </span>
                    )}
                    {post.tags.length > 0 && <span aria-hidden="true">·</span>}
                    <span>{post.tags.slice(0, 3).map((t) => `#${t}`).join(' ')}</span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="mono mt-6 py-4 text-center"
          style={{ fontSize: 11, color: 'var(--text-faint)' }}
          aria-live="polite"
        >
          {t(locale, 'list.loadingMore')}
        </div>
      )}

      {/* Bottom stats line */}
      <div className="mono mt-4" style={{ fontSize: 11, color: 'var(--text-faint)' }}>
        <span style={{ color: 'var(--accent)' }}>$</span>{' '}
        {t(locale, 'list.visibleOf', { visible: String(visible.length), total: String(filtered.length) })}
        {totalWords > 0 && <> · {t(locale, 'list.totalWords', { count: `${(totalWords / 1000).toFixed(1)}K` })}</>}
        {activeTag && ` · #${activeTag}`}
      </div>
    </div>
  )
}
