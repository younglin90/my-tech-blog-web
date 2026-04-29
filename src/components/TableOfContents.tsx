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

  const handleMobileNavClick = useCallback(() => setMobileOpen(false), [])

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
      {headings.map((h) => (
        <li
          key={h.id}
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
      {/* Mobile/narrow inline ToC (shown below 2xl where sidebar doesn't fit) */}
      <div
        className="mb-8 overflow-hidden rounded-lg 2xl:hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
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

      {/* Desktop fixed sidebar (2xl+ where 768px content + gap + sidebar fits without overlap) */}
      <nav
        className="fixed top-24 hidden w-52 2xl:block"
        aria-label="Table of contents"
        style={{ left: 'calc(50% + 24rem + 2rem)' }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {tocLabel}
          </p>
          <span className="text-[9px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="mb-3 h-px w-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full transition-[width] duration-150"
            style={{ width: `${progress}%`, background: 'var(--accent)', opacity: 0.6 }}
          />
        </div>
        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
          {tocList}
        </div>
      </nav>
    </>
  )
}
