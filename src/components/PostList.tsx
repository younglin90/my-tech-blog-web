'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { getAllDynamicPosts } from '@/lib/dynamic-posts'
import { getBookmarks } from '@/components/BookmarkButton'
import { ListStats } from '@/components/StatLine'
import { localePathPrefix, t } from '@/lib/i18n'
import { seriesTitle } from '@/lib/series-title'
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
  indexPath = '/post-index.json',
}: {
  staticPosts: StaticPostItem[]
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

  return (
    <div>
      {/* Tag filter + sort / view mode */}
      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTag(null)}
            className="inline-flex min-h-9 items-center rounded-full px-3 text-[12.5px] transition-colors duration-100"
                style={{
                  border: '1px solid',
                  borderColor: !activeTag ? 'var(--accent)' : 'var(--border-soft)',
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
              className="inline-flex min-h-9 items-center rounded-full px-3 text-[12.5px] transition-colors duration-100"
                style={{
                  border: '1px solid',
                  borderColor: activeTag === tag ? 'var(--accent)' : 'var(--border-soft)',
                  background: activeTag === tag ? 'var(--accent-glow)' : 'transparent',
                  color: activeTag === tag ? 'var(--accent)' : 'var(--text-muted)',
                }}
              title={t(locale, 'list.tagCount', { count: String(count) })}
            >
              {tag}
            </button>
          ))}
          {allTags.length > TAG_VISIBLE_LIMIT && (
            <button
              onClick={() => setShowAllTags((s) => !s)}
              className="inline-flex min-h-9 items-center px-2 text-[12.5px]"
              style={{ color: 'var(--text-faint)' }}
            >
              {showAllTags ? t(locale, 'list.less') : `+${allTags.length - TAG_VISIBLE_LIMIT}`}
            </button>
          )}
        </div>
      )}
      <div className="mb-2 flex items-center justify-end gap-3 text-xs" style={{ color: 'var(--text-faint)' }}>
        {(['newest', 'oldest'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => updateSort(mode)}
            className="min-h-9"
            style={{ color: sortMode === mode ? 'var(--text)' : 'var(--text-faint)', fontWeight: sortMode === mode ? 600 : 400 }}
          >
            {mode === 'newest' ? t(locale, 'list.sortNewest') : t(locale, 'list.sortOldest')}
          </button>
        ))}
        <span aria-hidden="true">·</span>
        <button
          onClick={() => updateCompact(!compact)}
          className="min-h-9"
          style={{ color: 'var(--text-muted)' }}
        >
          {compact ? t(locale, 'list.viewFull') : t(locale, 'list.viewCompact')}
        </button>
      </div>

      {/* Post list */}
      <div className="reveal-rows border-t" style={{ borderColor: 'var(--border-soft)' }}>
        {visible.map((post) => {
          const href = post.isDynamic ? `/read?id=${post.id}` : post.url
          // mounted 가드: 정적 HTML은 빌드 시각으로 굳으므로 클라이언트에서만 판정 (hydration mismatch 방지)
          const isNew = mounted && !post.isDynamic && Date.now() - new Date(post.date).getTime() < 7 * 24 * 60 * 60 * 1000
          const isRead = mounted && readPosts.has(post.id)
          const isBookmarked = mounted && bookmarks.has(post.id)
          const marks = (
            <>
              {isNew && (
                <span
                  className="ml-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
                  style={{ background: 'var(--accent)' }}
                  title={t(locale, 'list.new')}
                  aria-label={t(locale, 'list.new')}
                />
              )}
              {isRead && (
                <span className="ml-2 align-middle text-[11px]" style={{ color: 'var(--text-faint)' }} title={t(locale, 'list.read')}>✓</span>
              )}
              {isBookmarked && (
                <span className="ml-1 align-middle text-[11px]" style={{ color: 'var(--accent)' }} title={t(locale, 'list.saved')}>⊕</span>
              )}
            </>
          )

          if (compact) {
            return (
              <Link
                key={post.id}
                href={href}
                className="post-row flex items-baseline gap-4 border-b py-3"
                style={{ borderColor: 'var(--border-soft)' }}
              >
                <span className="tabular shrink-0 text-xs" style={{ color: 'var(--text-faint)' }}>
                  {format(parseISO(post.date), 'yyyy.MM.dd')}
                </span>
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium" style={{ color: 'var(--text)' }}>
                  {post.title}
                  {marks}
                </span>
              </Link>
            )
          }

          const series = (post as any).series as string | undefined
          const seriesOrder = (post as any).seriesOrder as number | undefined
          const seriesName = series ? seriesTitle(series, locale) : ''
          return (
            <Link key={post.id} href={href} className="post-row group block border-b py-6" style={{ borderColor: 'var(--border-soft)' }}>
              <div className="flex flex-wrap items-center gap-x-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                <time className="tabular" dateTime={post.date}>{format(parseISO(post.date), 'yyyy.MM.dd')}</time>
                {!post.isDynamic && post.readingTime && <><span aria-hidden="true">·</span><span>{post.readingTime}</span></>}
                {post.isDynamic && <><span aria-hidden="true">·</span><span>{t(locale, 'list.draft')}</span></>}
                {series && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span style={{ color: 'var(--accent)' }} title={t(locale, 'list.partOfSeries', { series: seriesName })}>
                      {seriesName}{seriesOrder ? ` ${seriesOrder}` : ''}
                    </span>
                  </>
                )}
              </div>
              {/* break-words: 긴 라틴 토큰(Barth–Jespersen 등)이 모바일에서 가로 오버플로를 내지 않게 */}
              <h2
                className="display mt-2 break-words transition-colors group-hover:[color:var(--accent)]"
                style={{ margin: '8px 0 0', fontSize: 19, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.35, color: 'var(--text)' }}
              >
                {post.title}
                {marks}
              </h2>
              <p className="line-clamp-2" style={{ margin: '8px 0 12px', fontSize: 14.5, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {post.description}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs" style={{ color: 'var(--text-faint)' }}>
                <span className="min-w-0 truncate">{post.tags.slice(0, 3).join(' · ')}</span>
                {!post.isDynamic && <ListStats slug={post.id} locale={locale} />}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Infinite scroll sentinel + 스켈레톤 카드 (시각적 로딩 피드백) */}
      {hasMore && (
        <div ref={sentinelRef} aria-live="polite" aria-busy="true">
          <div className="mt-2 space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="skeleton h-20 rounded-md"
                style={{ opacity: 1 - i * 0.25 }}
              />
            ))}
          </div>
          <p
            className="mono mt-3 text-center"
            style={{ fontSize: 11, color: 'var(--text-faint)' }}
          >
            {t(locale, 'list.loadingMore')}
          </p>
        </div>
      )}

      <p className="mt-4 text-xs" style={{ color: 'var(--text-faint)' }}>
        {t(locale, 'list.visibleOf', { visible: String(visible.length), total: String(filtered.length) })}
        {activeTag && ` · ${activeTag}`}
      </p>
    </div>
  )
}
