'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { loadPostIndexClient, type PostIndexItem } from '@/lib/post-index'

// 본문 안 내부 포스트 링크에 마우스를 ~250ms 올리고 있으면 제목만 보여 준다.
// 한 번 뜨면 그 자리에 고정된다. 팝업과 그 링크 글자에서 모두 벗어나야 사라진다.

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

function parseInternalPostHref(href: string): { locale: string; slug: string } | null {
  if (!href) return null
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

const CARD_WIDTH = 260
const CARD_HEIGHT = 58

function placeCard(rect: DOMRect) {
  const showAbove = rect.top > CARD_HEIGHT + 16
  const top = (showAbove ? rect.top - CARD_HEIGHT - 8 : rect.bottom + 8) + window.scrollY
  const rawLeft = rect.left + window.scrollX
  const maxLeft = window.scrollX + document.documentElement.clientWidth - CARD_WIDTH - 12
  const left = Math.max(window.scrollX + 12, Math.min(rawLeft, maxLeft))
  return { top, left }
}

function covers(rect: DOMRect, x: number, y: number, pad: number) {
  return x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad
}

export function LinkPreview() {
  const [hover, setHover] = useState<{ entry: PostIndexItem; href: string; top: number; left: number } | null>(null)
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cardRef = useRef<HTMLAnchorElement | null>(null)
  const anchorRef = useRef<HTMLAnchorElement | null>(null)
  const pendingRef = useRef<HTMLAnchorElement | null>(null)
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
    const hide = () => {
      cancelLeave()
      anchorRef.current = null
      pendingRef.current = null
      setHover(null)
    }
    const insideShown = (x: number, y: number) => {
      const anchor = anchorRef.current
      const card = cardRef.current
      if (!anchor) return false
      const a = anchor.getBoundingClientRect()
      const c = card?.getBoundingClientRect()
      if (!c) return covers(a, x, y, 8)
      const left = Math.min(a.left, c.left) - 8
      const right = Math.max(a.right, c.right) + 8
      const top = Math.min(a.top, c.top) - 8
      const bottom = Math.max(a.bottom, c.bottom) + 8
      return x >= left && x <= right && y >= top && y <= bottom
    }

    const onEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target || target.closest('[data-link-preview]')) return
      const a = target.closest('a') as HTMLAnchorElement | null
      if (!a || !article.contains(a)) return
      const parsed = parseInternalPostHref(a.getAttribute('href') ?? a.href)
      if (!parsed) return
      // 이미 떠 있는 카드는 마우스가 다른 링크를 스쳐도 따라가지 않는다.
      // 같은 글자로 돌아오면 사라지는 타이머만 끊는다.
      if (anchorRef.current) {
        if (anchorRef.current === a) cancelLeave()
        return
      }
      cancelEnter()
      pendingRef.current = a
      enterTimerRef.current = setTimeout(() => {
        void (async () => {
          if (pendingRef.current !== a) return
          const map = mapRef.current ?? await loadMap()
          if (pendingRef.current !== a) return
          const entry = map[`${parsed.slug}::${parsed.locale}`]
            ?? map[`${parsed.slug}::ko`]
            ?? Object.values(map).find((p) => p.slug === parsed.slug)
          if (!entry) return
          anchorRef.current = a
          pendingRef.current = null
          const { top, left } = placeCard(a.getBoundingClientRect())
          setHover({ entry, href: `/${parsed.locale}/posts/${parsed.slug}/`, top, left })
        })()
      }, 250)
    }

    const onMove = (e: PointerEvent) => {
      if (anchorRef.current) {
        if (insideShown(e.clientX, e.clientY)) cancelLeave()
        else if (!leaveTimerRef.current) leaveTimerRef.current = setTimeout(hide, 140)
        return
      }
      const pending = pendingRef.current
      if (!pending) return
      const r = pending.getBoundingClientRect()
      if (!covers(r, e.clientX, e.clientY, 6)) {
        cancelEnter()
        pendingRef.current = null
      }
    }

    article.addEventListener('mouseover', onEnter)
    window.addEventListener('pointermove', onMove)
    document.documentElement.addEventListener('pointerleave', hide)

    return () => {
      cancelled = true
      article.removeEventListener('mouseover', onEnter)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', hide)
      cancelEnter()
      cancelLeave()
    }
  }, [])

  if (!hover) return null

  return (
    <Link
      href={hover.href}
      ref={cardRef}
      data-link-preview=""
      className="absolute z-40 block rounded-md"
      style={{
        position: 'absolute',
        top: hover.top,
        left: hover.left,
        width: CARD_WIDTH,
        padding: '8px 10px',
        background: 'var(--surface)',
        border: '1px solid var(--accent)',
        boxShadow: '0 6px 18px rgba(0,0,0,0.18)',
      }}
    >
      <span className="line-clamp-2 text-[13px] font-semibold leading-snug" style={{ color: 'var(--accent)' }}>
        {hover.entry.title}
      </span>
    </Link>
  )
}
