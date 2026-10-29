'use client'

import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { t, type Locale } from '@/lib/i18n'

const PATHS = [
  {
    key: 'numerics',
    href: '/posts/fdm-fem-fvm',
  },
  {
    key: 'compressible',
    href: '/posts/riemann-solvers',
  },
  {
    key: 'openfoam',
    href: '/posts/2026-03-26-openfoam-backward-facing-step',
  },
] as const

export function StartHere({ locale }: { locale: Locale }) {
  return (
    <section aria-labelledby="start-here-title" className="mb-12">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id="start-here-title" className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {t(locale, 'home.start.title')}
        </h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {PATHS.map((path) => (
          <Link
            key={path.key}
            href={`/${locale}${path.href}`}
            className="group flex flex-col rounded-xl p-4 transition-colors duration-100 hover:[border-color:var(--accent)]"
            style={{ border: '1px solid var(--border-soft)' }}
          >
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>{t(locale, `home.start.${path.key}.meta`)}</span>
            <h3 className="mt-2 flex items-start justify-between gap-2 text-[15px] font-semibold leading-snug transition-colors group-hover:[color:var(--accent)]" style={{ color: 'var(--text)' }}>
              {t(locale, `home.start.${path.key}.title`)}
              <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 opacity-40 transition-opacity group-hover:opacity-100" aria-hidden="true" />
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t(locale, `home.start.${path.key}.body`)}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
