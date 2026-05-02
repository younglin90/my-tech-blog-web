'use client'

import { useEffect, useState } from 'react'
import { Focus, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

// 포스트 페이지 전용 집중 모드.
// 'F' 키 또는 좌하단 floating 버튼 클릭 → documentElement.dataset.focus="1" 적용.
// CSS에서 [data-focus="1"] 셀렉터로 헤더/푸터/모바일 nav/사이드바 등을 hide.
// ESC 또는 동일 토글로 해제. localStorage로 영속하지는 않음 (페이지 떠나면 자동 해제).
export function ReadingFocusMode() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (active) document.documentElement.dataset.focus = '1'
    else delete document.documentElement.dataset.focus
    return () => { delete document.documentElement.dataset.focus }
  }, [active])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        setActive((a) => !a)
      } else if (e.key === 'Escape' && active) {
        setActive(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [active])

  if (active) {
    return (
      <button
        type="button"
        onClick={() => setActive(false)}
        aria-label={t(locale, 'reading.focusExit')}
        title={t(locale, 'reading.focusExit')}
        className="fixed bottom-6 right-6 z-[60] inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium shadow-lg"
        style={{
          background: 'var(--accent)',
          color: '#08111f',
          minHeight: 44,
        }}
      >
        <X className="h-3.5 w-3.5" /> {t(locale, 'reading.focusExit')}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      aria-label={t(locale, 'reading.focus')}
      title={t(locale, 'reading.focusHint')}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      <Focus className="h-3.5 w-3.5" /> {t(locale, 'reading.focus')}
    </button>
  )
}
