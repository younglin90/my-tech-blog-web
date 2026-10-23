'use client'

import { ArrowUpRight, ClipboardCheck, Gauge, Grid3X3 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'
import { CFD_REVIEW, hasCfdReview } from '@/lib/monetization'

const NUMBER_LOCALE = {
  ko: 'ko-KR',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
  es: 'es-ES',
} as const

export function CfdReviewCallout({ source }: { source: 'post' | 'tool' | 'about' }) {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

  if (!hasCfdReview) return null

  const validPrice = /^\d+$/.test(CFD_REVIEW.priceKrw)
  const numericPrice = validPrice ? Number.parseInt(CFD_REVIEW.priceKrw, 10) : 0
  const price = numericPrice > 0
    ? new Intl.NumberFormat(NUMBER_LOCALE[locale]).format(numericPrice)
    : ''

  return (
    <aside
      className="my-12 overflow-hidden rounded-xl"
      style={{
        background:
          'linear-gradient(135deg, color-mix(in srgb, var(--accent) 11%, var(--surface)), var(--surface))',
        border: '1px solid var(--border)',
      }}
      aria-labelledby={`cfd-review-title-${source}`}
    >
      <div className="grid gap-6 p-5 sm:grid-cols-[1fr,auto] sm:items-center sm:p-6">
        <div>
          <p className="mono text-[10px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
            {t(locale, 'review.eyebrow')}
          </p>
          <h2
            id={`cfd-review-title-${source}`}
            className="display mt-2 text-xl font-semibold leading-snug"
            style={{ color: 'var(--text)' }}
          >
            {t(locale, 'review.title')}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {t(locale, 'review.body')}
          </p>
          <ul className="mt-4 grid gap-2 text-xs sm:grid-cols-3" style={{ color: 'var(--text-muted)' }}>
            <li className="flex items-center gap-2">
              <Grid3X3 aria-hidden="true" className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
              {t(locale, 'review.scope.mesh')}
            </li>
            <li className="flex items-center gap-2">
              <Gauge aria-hidden="true" className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
              {t(locale, 'review.scope.convergence')}
            </li>
            <li className="flex items-center gap-2">
              <ClipboardCheck aria-hidden="true" className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--accent)' }} />
              {t(locale, 'review.scope.next')}
            </li>
          </ul>
        </div>
        <div className="sm:text-right">
          {price && (
            <p className="mb-2 text-xs" style={{ color: 'var(--text-faint)' }}>
              {t(locale, 'review.price', { price })}
            </p>
          )}
          <a
            href={CFD_REVIEW.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            {t(locale, 'review.cta')}
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </a>
        </div>
      </div>
    </aside>
  )
}
