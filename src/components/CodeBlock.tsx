'use client'

import { useRef, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Copy, Check, ChevronDown } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

const MAX_COLLAPSED_HEIGHT = 420 // px — ~20 lines

export function CodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const preRef = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [overflows, setOverflows] = useState(false)
  const [wrapped, setWrapped] = useState(false)
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

  useEffect(() => {
    const el = preRef.current
    if (el) {
      setOverflows(el.scrollHeight > MAX_COLLAPSED_HEIGHT + 40)
    }
  }, [])

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    trackEvent('code-copy', { lang: (props as any)['data-language'] })
  }

  return (
    <div className="group relative">
      <div
        style={{
          maxHeight: overflows && !expanded ? MAX_COLLAPSED_HEIGHT : '4000px',
          overflow: overflows && !expanded ? 'hidden' : 'visible',
          position: 'relative',
          transition: 'max-height 0.32s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <pre ref={preRef} {...props} style={{ ...((props as any).style ?? {}), whiteSpace: wrapped ? 'pre-wrap' : undefined }}>
          {children}
        </pre>
        {overflows && !expanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent, var(--code-bg))',
            }}
          />
        )}
      </div>

      {/* Expand button */}
      {overflows && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex w-full items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium transition-colors duration-100"
          style={{
            background: 'var(--surface)',
            borderTop: expanded ? '1px solid var(--border)' : 'none',
            color: 'var(--text-muted)',
            borderRadius: '0 0 0.5rem 0.5rem',
          }}
        >
          <ChevronDown
            className="h-3.5 w-3.5 transition-transform duration-150"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          />
          {expanded ? t(locale, 'code.collapse') : t(locale, 'code.expand')}
        </button>
      )}

      {/* Wrap toggle */}
      <button
        onClick={() => setWrapped((w) => !w)}
        className="absolute right-20 top-3 hidden items-center gap-1 rounded px-2 py-1 text-[10px] font-medium opacity-0 transition-all duration-150 group-hover:opacity-100 sm:flex"
        style={{
          background: 'var(--surface-hover)',
          border: `1px solid ${wrapped ? 'var(--accent)' : 'var(--border)'}`,
          color: wrapped ? 'var(--accent)' : 'var(--text-muted)',
        }}
        aria-label={t(locale, 'code.toggleWrap')}
        title={t(locale, 'code.toggleWrap')}
      >
        ↵ {t(locale, 'code.wrap')}
      </button>

      {/* Copy button — always visible on touch, hover-only on pointer devices */}
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium opacity-100 transition-all duration-150 sm:opacity-0 sm:group-hover:opacity-100"
        style={{
          background: 'var(--surface-hover)',
          border: '1px solid var(--border)',
          color: copied ? 'var(--success)' : 'var(--text-muted)',
        }}
        aria-label={t(locale, 'code.copyCode')}
      >
        {copied ? (
          <><Check className="h-3 w-3" /> {t(locale, 'code.copied')}</>
        ) : (
          <><Copy className="h-3 w-3" /> {t(locale, 'code.copy')}</>
        )}
      </button>
    </div>
  )
}
