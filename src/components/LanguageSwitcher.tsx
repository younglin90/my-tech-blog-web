'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, Check } from 'lucide-react'
import { LOCALES, LOCALE_LABELS, withLocale, type Locale, isLocale, t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

export function LanguageSwitcher({ current }: { current?: string }) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Detect current locale from pathname if not provided
  const detected = (() => {
    if (current && isLocale(current)) return current as Locale
    const m = pathname.match(/^\/(ko|en|ja|zh|es)(?=\/|$)/)
    return (m?.[1] ?? 'ko') as Locale
  })()

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const switchTo = (next: Locale) => {
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`
    const target = withLocale(next, pathname)
    setOpen(false)
    trackEvent('language-switch', { from: detected, to: next })
    router.push(target)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
        style={{ color: 'var(--text-muted)' }}
        aria-label={t(detected, 'language.change')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" strokeWidth={1.5} />
        <span className="hidden sm:inline">{LOCALE_LABELS[detected]}</span>
        <span className="sm:hidden uppercase">{detected}</span>
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-md py-1 text-xs"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          }}
        >
          {LOCALES.map((loc) => {
            const active = loc === detected
            return (
              <li key={loc} role="option" aria-selected={active}>
                <button
                  onClick={() => switchTo(loc)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition-colors"
                  style={{
                    color: active ? 'var(--accent)' : 'var(--text)',
                    background: active ? 'var(--bg)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget.style.background = 'var(--bg)') }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget.style.background = 'transparent') }}
                >
                  <span>{LOCALE_LABELS[loc]}</span>
                  {active && <Check className="h-3 w-3" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
