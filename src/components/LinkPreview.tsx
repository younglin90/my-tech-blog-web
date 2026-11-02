'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { loadPostIndexClient, type PostIndexItem } from '@/lib/post-index'

// 본문(<article>) 안 내부 포스트 링크에 마우스를 ~250ms 올리고 있으면
// 제목만 보여 주는 작은 팝오버를 띄운다. 팝오버를 누르면 그 글로 이동한다.
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
  const [hover, setHover] = useState<{ entry: PostIndexItem; href: string; rect: DOMRect } | null>(null)
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardRef = useRef<HTMLAnchorElement | null>(null)
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
        setHover({ entry, href: `/${parsed.locale}/posts/${parsed.slug}/`, rect })
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

  const { entry, href, rect } = hover
  // 제목 두 줄 정도. 위 공간이 부족하면 링크 아래로 붙인다.
  const cardHeight = 58
  const showAbove = rect.top > cardHeight + 16
  const top = (showAbove ? rect.top - cardHeight - 8 : rect.bottom + 8) + window.scrollY
  const cardWidth = 260
  const rawLeft = rect.left + window.scrollX
  const maxLeft = window.scrollX + document.documentElement.clientWidth - cardWidth - 12
  const left = Math.max(window.scrollX + 12, Math.min(rawLeft, maxLeft))

  return (
    <Link
      href={href}
      ref={cardRef}
      className="absolute z-40 block rounded-md"
      style={{
        top, left,
        width: cardWidth,
        padding: '8px 10px',
        background: 'var(--surface)',
        border: '1px solid var(--accent)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
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
      <span className="line-clamp-2 text-[13px] font-semibold leading-snug" style={{ color: 'var(--accent)' }}>
        {entry.title}
      </span>
    </Link>
  )
}
