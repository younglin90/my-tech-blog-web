'use client'

import { usePathname } from 'next/navigation'
import { Beer, Coffee, ExternalLink, Heart } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'
import { SUPPORT, hasSupport } from '@/lib/monetization'

type SupportLinksProps = {
  source?: 'author' | 'about' | 'footer'
}

export function SupportLinks({ source = 'author' }: SupportLinksProps) {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

  if (!hasSupport) return null

  const tiers = [
    {
      key: 'coffee',
      href: SUPPORT.coffeeUrl,
      label: t(locale, 'support.coffee'),
      amount: t(locale, 'support.coffeeAmount'),
      impact: t(locale, 'support.coffeeImpact'),
      Icon: Coffee,
    },
    {
      key: 'beer',
      href: SUPPORT.beerUrl,
      label: t(locale, 'support.beer'),
      amount: t(locale, 'support.beerAmount'),
      impact: t(locale, 'support.beerImpact'),
      Icon: Beer,
    },
  ].filter((tier) => Boolean(tier.href))

  return (
    <section
      aria-labelledby="support-title"
      className="overflow-hidden rounded-xl"
      style={{
        background: 'color-mix(in srgb, var(--surface) 88%, var(--accent) 12%)',
        border: '1px solid color-mix(in srgb, var(--border) 72%, var(--accent) 28%)',
      }}
    >
      <div className="p-4 sm:p-5">
        <div className="mono text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--accent)' }}>
          {t(locale, 'support.eyebrow')}
        </div>
        <h2 id="support-title" className="display mt-1.5 text-lg font-semibold" style={{ color: 'var(--text)' }}>
          {t(locale, 'support.title')}
        </h2>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {t(locale, 'support.body')}
        </p>

        {tiers.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {tiers.map(({ key, href, label, amount, impact, Icon }) => (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex min-h-16 items-center gap-3 rounded-lg px-3.5 py-3 transition-colors duration-100 hover:[border-color:var(--accent)]"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                aria-label={`${label} · ${amount}`}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</span>
                    <span className="mono shrink-0 text-[11px]" style={{ color: 'var(--accent)' }}>{amount}</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-snug" style={{ color: 'var(--text-muted)' }}>{impact}</span>
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-45 transition-opacity group-hover:opacity-100" aria-hidden="true" />
              </a>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] leading-relaxed" style={{ color: 'var(--text-faint)' }}>
            {t(locale, 'support.checkoutNote')}
          </p>
          {SUPPORT.sponsorUrl && SUPPORT.sponsorUrl !== SUPPORT.coffeeUrl && (
          <a
            href={SUPPORT.sponsorUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium link-hover-text-accent"
            style={{ color: 'var(--text-muted)' }}
          >
            <Heart className="h-3.5 w-3.5" aria-hidden="true" />
            {t(locale, 'support.sponsor')}
          </a>
          )}
        </div>
      </div>
    </section>
  )
}
