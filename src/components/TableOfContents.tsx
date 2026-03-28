'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'

interface Heading {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

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
            className="block pl-2.5 leading-snug transition-colors duration-100"
            style={{
              color: activeId === h.id ? 'var(--accent)' : 'var(--text-faint)',
              fontWeight: activeId === h.id ? 500 : 400,
            }}
            onMouseEnter={(e) => {
              if (activeId !== h.id)
                (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'
            }}
            onMouseLeave={(e) => {
              if (activeId !== h.id)
                (e.currentTarget as HTMLElement).style.color = 'var(--text-faint)'
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
      {/* Mobile inline ToC (hidden on xl+) */}
      <div
        className="mb-8 overflow-hidden rounded-lg xl:hidden"
        style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
      >
        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--text-muted)' }}
          aria-expanded={mobileOpen}
        >
          On this page
          <ChevronDown
            className="h-3.5 w-3.5 transition-transform duration-150"
            style={{ transform: mobileOpen ? 'rotate(180deg)' : 'none' }}
          />
        </button>
        {mobileOpen && (
          <div className="border-t px-4 pb-4 pt-3" style={{ borderColor: 'var(--border)' }}>
            {tocList}
          </div>
        )}
      </div>

      {/* Desktop fixed sidebar (xl+) */}
      <nav
        className="fixed right-6 top-24 hidden w-52 xl:block"
        aria-label="Table of contents"
      >
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
          On this page
        </p>
        <div className="max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
          {tocList}
        </div>
      </nav>
    </>
  )
}
