'use client'

import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'

export function PrintButton() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  return (
    <button
      onClick={() => window.print()}
      className="share-btn flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
      aria-label={t(locale, 'post.print')}
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="6" y="14" width="12" height="8" rx="1"/>
      </svg>
      {t(locale, 'post.print')}
    </button>
  )
}
