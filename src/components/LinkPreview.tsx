'use client'

import { useEffect, useRef, useState } from 'react'
import { loadPostIndexClient, type PostIndexItem } from '@/lib/post-index'

// 본문(<article>) 안 내부 포스트 링크에 마우스를 ~250ms 올리고 있으면
// 작은 팝오버(제목·설명·날짜·태그·읽기시간)를 띄운다. Wikipedia/Notion 스타일.
//
// SSR 비용 0 — post-index.json을 한 번 fetch해 캐시.
// 동일 슬러그를 5개 locale 모두 가지므로 사용자 현재 locale로 매치 후 fallback.
//
// 모바일은 hover 이벤트가 없으므로 자동으로 비활성 — 그냥 일반 링크 동작.

interface PostMap {
  [slug_locale: string]: PostIndexItem
}

let cachedMap: PostMap | null = null
let inflight: Promise<PostMap> | null = null

async function loadMap(): Promise<PostMap> {
  if (cachedMap) return cachedMap
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const payload = await loadPostIndexClient('/post-index.json')
      const map: PostMap = {}
      for (const item of payload.items) {
        map[`${item.slug}::${item.locale}`] = item
      }
      cachedMap = map
      return map
    } catch {
      cachedMap = {}
      return cachedMap
    } finally {
      inflight = null
    }
  })()
  return inflight
}

interface Anchor {
  el: HTMLAnchorElement
  slug: string
  locale: string
}

function parseInternalPostHref(href: string): { locale: string; slug: string } | null {
  if (!href) return null
  // 절대 URL이면 origin 일치만 허용 — 외부는 제외
  let path: string
  try {
    const u = new URL(href, window.location.origin)
    if (u.origin !== window.location.origin) return null
    path = u.pathname
  } catch {
    return null
  }
  const m = path.match(/^\/(ko|en|ja|zh|es)\/posts\/([^/]+)\/?$/)
  if (!m) return null
  return { locale: m[1], slug: m[2] }
}

export function LinkPreview() {
  const [hover, setHover] = useState<{ entry: PostIndexItem; rect: DOMRect } | null>(null)
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<PostMap | null>(null)

  useEffect(() => {
    let cancelled = false
    loadMap().then((m) => { if (!cancelled) mapRef.current = m })

    const article = document.querySelector('article')
    if (!article) return

    const cancelEnter = () => {
      if (enterTimerRef.current) {
        clearTimeout(enterTimerRef.current)
        enterTimerRef.current = null
      }
    }
    const cancelLeave = () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current)
        leaveTimerRef.current = null
      }
    }

    const onEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const a = target.closest('a') as HTMLAnchorElement | null
      if (!a || !article.contains(a)) return
      const parsed = parseInternalPostHref(a.getAttribute('href') ?? a.href)
      if (!parsed) return

      cancelEnter()
      cancelLeave()
      enterTimerRef.current = setTimeout(() => {
        const map = mapRef.current
        if (!map) return
        // 사용자 현재 locale URL이라도, 동일 slug에서 같은 locale을 우선
        const entry = map[`${parsed.slug}::${parsed.locale}`]
          ?? map[`${parsed.slug}::ko`]
          ?? Object.values(map).find((p) => p.slug === parsed.slug)
        if (!entry) return
        const rect = a.getBoundingClientRect()
        setHover({ entry, rect })
      }, 250)
    }

    const onLeave = (e: MouseEvent) => {
      const related = e.relatedTarget as Node | null
      // 카드 위로 옮겨갔다면 유지
      if (related && cardRef.current?.contains(related)) return
      cancelEnter()
      cancelLeave()
      leaveTimerRef.current = setTimeout(() => setHover(null), 180)
    }

    article.addEventListener('mouseover', onEnter)
    article.addEventListener('mouseout', onLeave)
    window.addEventListener('scroll', () => setHover(null), { passive: true })

    return () => {
      cancelled = true
      article.removeEventListener('mouseover', onEnter)
      article.removeEventListener('mouseout', onLeave)
      cancelEnter()
      cancelLeave()
    }
  }, [])

  if (!hover) return null

  const { entry, rect } = hover
  // 화면 위쪽으로 띄움. 위 공간 부족하면 아래로
  const cardHeight = 150
  const showAbove = rect.top > cardHeight + 16
  const top = (showAbove ? rect.top - cardHeight - 8 : rect.bottom + 8) + window.scrollY
  // 좌측 정렬, 우측 viewport 넘침 방지
  const cardWidth = 320
  const rawLeft = rect.left + window.scrollX
  const maxLeft = window.scrollX + document.documentElement.clientWidth - cardWidth - 12
  const left = Math.max(window.scrollX + 12, Math.min(rawLeft, maxLeft))

  return (
    <div
      ref={cardRef}
      role="tooltip"
      className="absolute z-40 rounded-lg shadow-xl"
      style={{
        top, left,
        width: cardWidth,
        padding: '12px 14px',
        background: 'var(--surface)',
        border: '1px solid var(--accent)',
        boxShadow: '0 8px 28px rgba(0,0,0,0.22)',
        pointerEvents: 'auto',
      }}
      onMouseEnter={() => {
        if (leaveTimerRef.current) {
          clearTimeout(leaveTimerRef.current)
          leaveTimerRef.current = null
        }
      }}
      onMouseLeave={() => {
        if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current)
        leaveTimerRef.current = setTimeout(() => setHover(null), 120)
      }}
    >
      <div className="mono mb-1 flex items-center gap-2 text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
        <span>{entry.date} · {entry.readingTime}</span>
        {entry.series && (
          <span
            className="rounded px-1 py-0.5"
            style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
          >
            {entry.series}
            {entry.seriesOrder ? ` · ${String(entry.seriesOrder).padStart(2, '0')}` : ''}
          </span>
        )}
      </div>
      <div className="mb-1.5 text-sm font-semibold" style={{ color: 'var(--accent)', lineHeight: 1.35 }}>
        {entry.title}
      </div>
      {entry.description && (
        <div className="mb-2 line-clamp-3 text-xs" style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {entry.description}
        </div>
      )}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {entry.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="mono rounded px-1.5 py-0.5 text-[10px]"
              style={{ background: 'var(--bg)', color: 'var(--text-faint)', border: '1px solid var(--border)' }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
