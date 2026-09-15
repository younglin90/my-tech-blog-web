'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'

function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0)
    }
    window.addEventListener('scroll', update, { passive: true })
    update()
    return () => window.removeEventListener('scroll', update)
  }, [])
  return progress
}

interface Heading {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const tocLabel = t(locale, 'post.tableOfContents')
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const progress = useScrollProgress()
  const listRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const [pastArticle, setPastArticle] = useState(false)

  const handleMobileNavClick = useCallback(() => setMobileOpen(false), [])

  // article 끝(<article>의 하단)이 viewport 위로 올라가면 ToC 자동 숨김 → fixed지만 sticky-like UX
  useEffect(() => {
    const article = document.querySelector('article')
    if (!article) return
    const onScroll = () => {
      const rect = article.getBoundingClientRect()
      setPastArticle(rect.bottom < 200)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // 활성 항목이 ToC 컨테이너 밖으로 가려지면 자동 스크롤로 보이게.
  useEffect(() => {
    if (!activeId) return
    const item = itemRefs.current[activeId]
    const list = listRef.current
    if (!item || !list) return
    const itemRect = item.getBoundingClientRect()
    const listRect = list.getBoundingClientRect()
    const margin = 32
    if (itemRect.top < listRect.top + margin || itemRect.bottom > listRect.bottom - margin) {
      // 부드럽게 가운데로 이동
      const offset = item.offsetTop - list.clientHeight / 2 + item.clientHeight / 2
      list.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' })
    }
  }, [activeId])

  useEffect(() => {
    // Collect headings rendered by MDX (h2, h3 only)
    const nodes = Array.from(document.querySelectorAll<HTMLHeadingElement>('.mdx h2, .mdx h3'))
    setHeadings(
      nodes.map((el) => ({
        id: el.id,
        text: el.textContent?.replace(/#\s*$/, '').trim() ?? '',
        level: Number(el.tagName[1]),
      })).filter((h) => h.id)
    )

    // Active heading tracking
    observerRef.current?.disconnect()
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length > 0) {
          // Pick the topmost visible heading
          const topmost = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          )
          setActiveId(topmost.target.id)
        }
      },
      { rootMargin: '0px 0px -60% 0px', threshold: 0 }
    )
    nodes.forEach((el) => observerRef.current?.observe(el))

    return () => observerRef.current?.disconnect()
  }, [])

  if (headings.length < 2) return null

  const tocList = (
    <ul className="space-y-1.5 text-xs">
      {headings.map((h, index) => (
        <li
          key={`${h.id}-${index}`}
          ref={(el) => { itemRefs.current[h.id] = el }}
          style={{
            paddingLeft: h.level === 3 ? '0.75rem' : '0',
            borderLeft: `2px solid ${activeId === h.id ? 'var(--accent)' : 'transparent'}`,
            marginLeft: '-0.75rem',
            transition: 'border-color 0.15s',
          }}
        >
          <a
            href={`#${h.id}`}
            className={`toc-link flex min-h-9 items-center pl-2.5 leading-snug transition-colors duration-100${activeId === h.id ? ' toc-link--active' : ''}`}
            style={{
              color: activeId === h.id ? 'var(--accent)' : 'var(--text-faint)',
              fontWeight: activeId === h.id ? 500 : 400,
            }}
            onClick={handleMobileNavClick}
          >
            {h.text}
          </a>
        </li>
      ))}
    </ul>
  )

  return (
    <>
      {/* Mobile/narrow inline ToC (shown below xl where sidebar doesn't fit). sticky로 스크롤 따라옴. */}
      <div
        className="sticky top-2 z-30 mb-8 overflow-hidden rounded-lg xl:hidden"
        style={{
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}
      >
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="flex min-h-11 w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
          aria-expanded={mobileOpen}
        >
          {tocLabel}
          <ChevronDown
            className="h-3.5 w-3.5 transition-transform duration-150"
            style={{ transform: mobileOpen ? 'rotate(180deg)' : 'none' }}
          />
        </button>
        <div
          style={{
            maxHeight: mobileOpen ? '400px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.2s ease',
          }}
        >
          <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--border)' }}>
            {tocList}
          </div>
        </div>
      </div>

      {/* Desktop fixed side rail (xl+). max-w-3xl 부모 외부에 viewport 좌표로 배치돼 스크롤
          내내 우측에 따라옴. article 끝에 도달하면 자동 페이드아웃 → sticky-like UX.
          좁은 화면(<xl)에서는 inline ToC만 노출(이미 sticky 처리). */}
      <nav
        data-toc-sidebar
        className="fixed top-24 hidden w-52 xl:block"
        aria-label="Table of contents"
        style={{
          left: 'calc(50% + 24rem + 1.25rem)',
          opacity: pastArticle ? 0 : 1,
          pointerEvents: pastArticle ? 'none' : 'auto',
          transition: 'opacity 0.25s ease',
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {tocLabel}
          </p>
          <span className="mono text-[10px] tabular-nums" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            {Math.round(progress)}%
          </span>
        </div>
        {/* 좌측 세로 progress 트랙 + ToC 리스트를 함께 묶음 */}
        <div className="relative pl-3">
          {/* 트랙 (전체 길이, 옅은 색) */}
          <div
            className="absolute left-0 top-0 bottom-0 w-px"
            style={{ background: 'var(--border)' }}
          />
          {/* 채워진 부분 (현재 진행률만큼 위에서 아래로) */}
          <div
            className="absolute left-0 top-0 w-px transition-[height] duration-150"
            style={{
              height: `${progress}%`,
              background: 'var(--accent)',
              boxShadow: '0 0 4px var(--accent)',
            }}
          />
          {/* 트랙 위 현재 위치 점 */}
          <div
            className="absolute -left-[3px] transition-[top] duration-150"
            style={{
              top: `calc(${progress}% - 3px)`,
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 6px var(--accent)',
            }}
          />
          <div
            ref={listRef}
            className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-1"
            style={{ scrollBehavior: 'smooth' }}
          >
            {tocList}
          </div>
        </div>
      </nav>
    </>
  )
}
