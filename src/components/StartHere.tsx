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
    <section
      aria-labelledby="start-here-title"
      className="mb-10 rounded-xl p-4 sm:p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mono text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
            {t(locale, 'home.start.eyebrow')}
          </p>
          <h2 id="start-here-title" className="display mt-1 text-xl font-semibold" style={{ color: 'var(--text)' }}>
            {t(locale, 'home.start.title')}
          </h2>
        </div>
        <p className="max-w-sm text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {t(locale, 'home.start.body')}
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {PATHS.map((path, index) => (
          <Link
            key={path.key}
            href={`/${locale}${path.href}`}
            className="group flex min-h-36 flex-col rounded-lg p-3.5 transition-colors duration-100 hover:[border-color:var(--accent)]"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <div className="mono flex items-center justify-between text-[10px]" style={{ color: 'var(--text-faint)' }}>
              <span>{String(index + 1).padStart(2, '0')} / 03</span>
              <span>{t(locale, `home.start.${path.key}.meta`)}</span>
            </div>
            <h3 className="mt-4 text-sm font-semibold leading-snug transition-colors group-hover:[color:var(--accent)]" style={{ color: 'var(--text)' }}>
              {t(locale, `home.start.${path.key}.title`)}
            </h3>
            <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {t(locale, `home.start.${path.key}.body`)}
            </p>
            <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[11px] font-medium" style={{ color: 'var(--accent)' }}>
              {t(locale, 'home.start.cta')}
              <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
