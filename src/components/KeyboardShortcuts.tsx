'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { X } from 'lucide-react'
import { localePathPrefix } from '@/lib/i18n'

const shortcuts = [
  { keys: ['Ctrl', 'K'], mac: ['⌘', 'K'], description: 'Open search' },
  { keys: ['/'], mac: ['/'], description: 'Quick search' },
  { keys: ['?'], mac: ['?'], description: 'Show shortcuts' },
  { keys: ['T'], mac: ['T'], description: 'Toggle theme' },
  { keys: ['R'], mac: ['R'], description: 'Random post' },
  { keys: ['G', 'G'], mac: ['G', 'G'], description: 'Scroll to top' },
  { keys: ['G', 'H'], mac: ['G', 'H'], description: 'Go home' },
  { keys: ['G', 'T'], mac: ['G', 'T'], description: 'Go to tags' },
  { keys: ['G', 'A'], mac: ['G', 'A'], description: 'Go to about' },
  { keys: ['G', 'B'], mac: ['G', 'B'], description: 'Go to bookmarks' },
  { keys: ['J'], mac: ['J'], description: 'Next post (on post page)' },
  { keys: ['K'], mac: ['K'], description: 'Prev post (on post page)' },
  { keys: ['Esc'], mac: ['Esc'], description: 'Close modal' },
]

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)
  const [isMac, setIsMac] = useState(false)
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const { theme, setTheme } = useTheme()
  const themeRef = useRef(theme)

  useEffect(() => {
    setIsMac(navigator.platform.toUpperCase().includes('MAC'))
  }, [])

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  useEffect(() => {
    let buffer = ''
    let bufferTimer: ReturnType<typeof setTimeout>

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        setOpen((o) => !o)
        return
      }
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (e.key === 't' && !e.ctrlKey && !e.metaKey) {
        setTheme(themeRef.current === 'dark' ? 'light' : 'dark')
        return
      }

      // Chord shortcuts (g+h, g+t, g+a)
      buffer += e.key.toUpperCase()
      clearTimeout(bufferTimer)
      bufferTimer = setTimeout(() => { buffer = '' }, 800)

      if (buffer === 'GG') { window.scrollTo({ top: 0, behavior: 'smooth' }); buffer = '' }
      else if (buffer === 'GH') { router.push(`/${locale}`); buffer = '' }
      else if (buffer === 'GT') { router.push(`/${locale}/tags`); buffer = '' }
      else if (buffer === 'GA') { router.push(`/${locale}/about`); buffer = '' }
      else if (buffer === 'GB') { router.push(`/${locale}/bookmarks`); buffer = '' }
    }

    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      clearTimeout(bufferTimer)
    }
  }, [router, locale])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0"
        style={{ background: 'var(--on-accent)', opacity: 0.6 }}
        onClick={() => setOpen(false)}
      />
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Keyboard Shortcuts</p>
          <button onClick={() => setOpen(false)} style={{ color: 'var(--text-muted)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="divide-y p-2" style={{ borderColor: 'var(--border)' }}>
          {shortcuts.map(({ keys, mac, description }) => {
            const displayKeys = isMac ? mac : keys
            return (
              <div key={description} className="flex items-center justify-between rounded-lg px-3 py-2.5">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{description}</span>
                <div className="flex items-center gap-1">
                  {displayKeys.map((k, i) => (
                    <span key={i}>
                      <kbd
                        className="rounded px-1.5 py-0.5 text-[11px] font-medium"
                        style={{ background: 'var(--surface-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderBottomWidth: '2px' }}
                      >
                        {k}
                      </kbd>
                      {i < displayKeys.length - 1 && (
                        <span className="mx-0.5 text-xs" style={{ color: 'var(--text-faint)' }}>+</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <div className="px-5 py-3 text-center text-[10px]" style={{ color: 'var(--text-faint)', borderTop: '1px solid var(--border)' }}>
          Press <kbd className="rounded px-1 text-[10px]" style={{ background: 'var(--surface-hover)', border: '1px solid var(--border)' }}>?</kbd> to toggle
        </div>
      </div>
    </div>
  )
}
