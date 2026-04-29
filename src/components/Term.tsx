'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix } from '@/lib/i18n'
import glossary from '@/lib/glossary.json'

interface Entry { ko: string; en: string; wiki?: string }

// MDX에서 사용: <Term name="Reynolds">Reynolds 수</Term>
//
// 호버 250ms 후 풍부한 popover (용어·정의·wiki 링크)를 띄운다. 네이티브
// title 툴팁 대비 즉시성·스타일·모바일 대응 모두 향상. 포커스 시(키보드
// Tab)도 동일하게 노출되어 접근성 OK.
//
// 클릭은 기존대로 /glossary#name 으로 이동.
export function Term({ name, children }: { name: string; children?: React.ReactNode }) {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const entry = (glossary as Record<string, Entry>)[name]

  const anchorRef = useRef<HTMLAnchorElement | null>(null)
  const popRef = useRef<HTMLDivElement | null>(null)
  const enterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; placement: 'top' | 'bottom' } | null>(null)

  if (!entry) return <>{children ?? name}</>
  const def = locale === 'ko' ? entry.ko : entry.en

  const computePos = () => {
    const a = anchorRef.current
    if (!a) return
    const rect = a.getBoundingClientRect()
    const popWidth = 280
    const popHeight = 110
    const above = rect.top > popHeight + 12
    const top = (above ? rect.top - popHeight - 8 : rect.bottom + 8) + window.scrollY
    const rawLeft = rect.left + rect.width / 2 - popWidth / 2 + window.scrollX
    const maxLeft = window.scrollX + document.documentElement.clientWidth - popWidth - 12
    const left = Math.max(window.scrollX + 12, Math.min(rawLeft, maxLeft))
    setPos({ top, left, placement: above ? 'top' : 'bottom' })
  }

  const cancelLeave = () => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current)
      leaveTimerRef.current = null
    }
  }
  const scheduleOpen = () => {
    cancelLeave()
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current)
    enterTimerRef.current = setTimeout(() => {
      computePos()
      setOpen(true)
    }, 250)
  }
  const scheduleClose = () => {
    if (enterTimerRef.current) clearTimeout(enterTimerRef.current)
    cancelLeave()
    leaveTimerRef.current = setTimeout(() => setOpen(false), 180)
  }

  // 스크롤·resize 시 popover 닫기 (위치 어긋남 방지)
  useEffect(() => {
    if (!open) return
    const onScroll = () => setOpen(false)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [open])

  return (
    <>
      <a
        ref={anchorRef}
        href={`/${locale}/glossary#${name.toLowerCase()}`}
        className="inline-block"
        style={{
          color: 'var(--accent)',
          textDecoration: 'underline',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: '3px',
        }}
        onMouseEnter={scheduleOpen}
        onMouseLeave={scheduleClose}
        onFocus={scheduleOpen}
        onBlur={scheduleClose}
        aria-describedby={open ? `term-pop-${name}` : undefined}
      >
        {children ?? name}
      </a>
      {open && pos && (
        <div
          ref={popRef}
          id={`term-pop-${name}`}
          role="tooltip"
          className="absolute z-50 rounded-lg shadow-xl"
          style={{
            top: pos.top,
            left: pos.left,
            width: 280,
            padding: '10px 12px',
            background: 'var(--surface)',
            border: '1px solid var(--accent)',
            boxShadow: '0 6px 22px rgba(0,0,0,0.22)',
            pointerEvents: 'auto',
          }}
          onMouseEnter={cancelLeave}
          onMouseLeave={scheduleClose}
        >
          <div
            className="mono mb-1 text-[10px] uppercase tracking-widest"
            style={{ color: 'var(--text-faint)' }}
          >
            {name}
          </div>
          <div
            className="text-xs"
            style={{ color: 'var(--text-muted)', lineHeight: 1.5 }}
          >
            {def}
          </div>
          {entry.wiki && (
            <a
              href={entry.wiki}
              target="_blank"
              rel="noopener noreferrer"
              className="mono mt-2 inline-block text-[10px] underline"
              style={{ color: 'var(--text-faint)' }}
              onClick={(e) => e.stopPropagation()}
            >
              wiki ↗
            </a>
          )}
        </div>
      )}
    </>
  )
}
