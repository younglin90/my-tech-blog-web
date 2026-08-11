'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Globe, Check } from 'lucide-react'
import { LOCALES, LOCALE_LABELS, withLocale, type Locale, isLocale, t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'
import { loadPostIndexClient } from '@/lib/post-index'

export function LanguageSwitcher({ current }: { current?: string }) {
  const pathname = usePathname() ?? '/'
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [availableLocales, setAvailableLocales] = useState<Set<Locale> | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  // Detect current locale from pathname if not provided
  const detected = (() => {
    if (current && isLocale(current)) return current as Locale
    const m = pathname.match(/^\/(ko|en|ja|zh|es)(?=\/|$)/)
    return (m?.[1] ?? 'ko') as Locale
  })()

  // 포스트 페이지면 post-index에서 번역 가용 locale 추출.
  // 그 외 페이지는 모든 locale 가용 (page level은 모든 locale 정적 생성).
  const postSlug = pathname.match(/^\/(?:ko|en|ja|zh|es)\/posts\/([^/]+)\/?$/)?.[1]

  useEffect(() => {
    if (!postSlug) {
      setAvailableLocales(null)
      return
    }
    let cancelled = false
    loadPostIndexClient()
      .then((payload) => {
        if (cancelled) return
        const set = new Set<Locale>()
        for (const item of payload.items) {
          if (item.slug === postSlug) set.add(item.locale)
        }
        setAvailableLocales(set)
      })
      .catch(() => { if (!cancelled) setAvailableLocales(null) })
    return () => { cancelled = true }
  }, [postSlug])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  // 실제 <a href>로 렌더한다. 예전에는 button + router.push라 5개 locale 트리 사이에
  // 크롤 가능한 링크가 하나도 없었다 — 검색엔진이 보는 연결고리가 hreflang 주석뿐이었다.
  // 클릭은 그대로 가로채 쿠키를 심고 SPA 전환을 하되, href는 항상 유효하게 둔다.
  const hrefFor = (next: Locale) => {
    const target = withLocale(next, pathname)
    return target.endsWith('/') ? target : `${target}/`
  }

  const switchTo = (e: React.MouseEvent, next: Locale) => {
    // 새 탭/새 창으로 여는 건 브라우저에 맡긴다
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`
    setOpen(false)
    trackEvent('language-switch', { from: detected, to: next })
    router.push(hrefFor(next))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 min-w-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1.5 text-xs font-medium transition-colors"
        style={{ color: 'var(--text-muted)' }}
        aria-label={t(detected, 'language.change')}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" strokeWidth={1.5} />
        <span className="hidden sm:inline">{LOCALE_LABELS[detected]}</span>
        <span className="sm:hidden uppercase">{detected}</span>
      </button>
      {/* 목록은 닫혀 있어도 DOM에 남긴다. {open && ...}로 조건부 렌더하면 초기 HTML에
          링크가 없어서, 크롤러 입장에서 locale 트리 사이에 연결이 하나도 없게 된다. */}
      <ul
          role="listbox"
          hidden={!open}
          className="absolute right-0 top-full z-50 mt-1 min-w-[140px] overflow-hidden rounded-md py-1 text-xs"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: open ? undefined : 'none',
          }}
        >
          {LOCALES.map((loc) => {
            const active = loc === detected
            const isFallback = availableLocales !== null && !availableLocales.has(loc) && loc !== 'ko'
            return (
              <li key={loc} role="option" aria-selected={active}>
                <a
                  href={hrefFor(loc)}
                  hrefLang={loc}
                  onClick={(e) => switchTo(e, loc)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 px-3 py-1.5 text-left transition-colors"
                  style={{
                    color: active ? 'var(--accent)' : isFallback ? 'var(--text-faint)' : 'var(--text)',
                    background: active ? 'var(--bg)' : 'transparent',
                  }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget.style.background = 'var(--bg)') }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget.style.background = 'transparent') }}
                  title={isFallback ? `→ ko fallback` : undefined}
                >
                  <span>
                    {LOCALE_LABELS[loc]}
                    {isFallback && (
                      <span className="mono ml-1.5 text-[9px]" style={{ color: 'var(--text-faint)' }}>
                        →ko
                      </span>
                    )}
                  </span>
                  {active && <Check className="h-3 w-3" />}
                </a>
              </li>
            )
          })}
        </ul>
    </div>
  )
}
