'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

interface Props {
  title: string
  date: string   // YYYY-MM-DD
  slug: string
  author?: string
}

function generateBibTeX({ title, date, slug, author, url }: Props & { url: string }) {
  const year = date.slice(0, 4)
  const month = date.slice(5, 7)
  const key = `younglin${year}_${slug.replace(/-/g, '_').slice(0, 20)}`
  return `@misc{${key},
  author    = {${author ?? 'Younglin'}},
  title     = {{${title}}},
  year      = {${year}},
  month     = {${month}},
  url       = {${url}},
  note      = {CFD.Lab blog post}
}`
}

export function CiteButton({ title, date, slug, author }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const url = typeof window !== 'undefined' ? window.location.href : `/${locale}/posts/${slug}`

  const bibtex = generateBibTeX({ title, date, slug, author, url })

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bibtex)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    trackEvent('cite', { slug })
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors duration-100"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
        }}
        aria-label="Copy BibTeX citation"
      >
        <span>cite</span>
        <span style={{ color: 'var(--text-faint)' }}>&#123;&#125;</span>
      </button>

      {open && (
        <div
          className="absolute bottom-10 right-0 z-50 w-80 rounded-lg p-4 shadow-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
              BibTeX
            </span>
            <button
              onClick={() => setOpen(false)}
              className="text-sm leading-none"
              style={{ color: 'var(--text-faint)' }}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <pre
            className="mono overflow-x-auto rounded-md p-3 text-[11px] leading-relaxed"
            style={{ background: 'var(--bg)', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
          >
            {bibtex}
          </pre>
          <button
            onClick={handleCopy}
            className="mt-3 w-full rounded-md py-1.5 text-xs font-medium transition-colors"
            style={{
              background: copied ? 'var(--accent-glow)' : 'var(--bg)',
              color: copied ? 'var(--accent)' : 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy BibTeX'}
          </button>
        </div>
      )}
    </div>
  )
}
