'use client'

import { useRef, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Copy, Check, ChevronDown, Download } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

const MAX_COLLAPSED_HEIGHT = 420 // px — ~20 lines

// 흔히 등장하는 언어 alias → 파일 확장자 매핑.
// CFD 블로그 컨텍스트라 fortran/cpp까지 우선 케어.
const LANG_TO_EXT: Record<string, string> = {
  python: 'py', py: 'py',
  cpp: 'cpp', 'c++': 'cpp', cxx: 'cpp', cc: 'cpp',
  c: 'c',
  fortran: 'f90', f90: 'f90', f95: 'f95', f77: 'f',
  rust: 'rs', rs: 'rs',
  go: 'go', golang: 'go',
  javascript: 'js', js: 'js',
  typescript: 'ts', ts: 'ts',
  jsx: 'jsx', tsx: 'tsx',
  bash: 'sh', sh: 'sh', shell: 'sh', zsh: 'sh',
  yaml: 'yaml', yml: 'yml',
  json: 'json',
  html: 'html', xml: 'xml',
  css: 'css', scss: 'scss',
  sql: 'sql',
  matlab: 'm',
  julia: 'jl',
  r: 'R',
  toml: 'toml',
  dockerfile: 'Dockerfile',
  makefile: 'Makefile',
  text: 'txt', plaintext: 'txt', plain: 'txt',
}

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

  const lang = String((props as any)['data-language'] ?? '').toLowerCase()

  const handleCopy = async () => {
    const text = preRef.current?.textContent ?? ''
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    trackEvent('code-copy', { lang })
  }

  const handleDownload = () => {
    const text = preRef.current?.textContent ?? ''
    if (!text.trim()) return
    const ext = LANG_TO_EXT[lang] ?? 'txt'
    // 페이지 slug 기반 파일명 — 추적·관리에 도움
    const slugMatch = pathname.match(/\/posts\/([^/]+)/)
    const baseSlug = slugMatch?.[1]?.replace(/^\d{4}-\d{2}-\d{2}-/, '').slice(0, 32) ?? 'snippet'
    const rand = Math.random().toString(36).slice(2, 6)
    const baseName = ['Dockerfile', 'Makefile'].includes(ext)
      ? ext   // 이 두 가지는 확장자가 곧 파일명
      : `${baseSlug}-${rand}.${ext}`
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = baseName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    trackEvent('code-download', { lang, file: baseName })
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
          className="flex min-h-11 w-full items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium transition-colors duration-100"
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

      {/* Download button — hover-only on pointer devices */}
      <button
        onClick={handleDownload}
        className="absolute right-[7.5rem] top-3 hidden items-center gap-1 rounded px-2 py-1 text-[10px] font-medium opacity-0 transition-all duration-150 group-hover:opacity-100 sm:flex"
        style={{
          background: 'var(--surface-hover)',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
        }}
        aria-label={t(locale, 'code.download')}
        title={t(locale, 'code.download')}
      >
        <Download className="h-3 w-3" /> {t(locale, 'code.download')}
      </button>

      {/* Copy button — always visible on touch, hover-only on pointer devices */}
      <button
        onClick={handleCopy}
        className="absolute right-3 top-3 flex min-h-11 min-w-11 items-center justify-center gap-1 rounded px-2 py-1 text-[10px] font-medium opacity-100 transition-all duration-150 sm:min-h-0 sm:min-w-0 sm:opacity-0 sm:group-hover:opacity-100"
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
