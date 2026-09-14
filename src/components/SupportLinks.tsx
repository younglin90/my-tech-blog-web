'use client'

import { usePathname } from 'next/navigation'
import { Coffee, Heart, Wallet } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'
import { SUPPORT, hasSupport } from '@/lib/monetization'
import { trackEvent } from '@/lib/analytics'

type Link = { key: string; href: string; label: string; Icon: typeof Heart }

export function SupportLinks() {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

  if (!hasSupport) return null

  const links: Link[] = []
  if (SUPPORT.githubSponsors)
    links.push({
      key: 'sponsor',
      href: `https://github.com/sponsors/${SUPPORT.githubSponsors}`,
      label: t(locale, 'support.sponsor'),
      Icon: Heart,
    })
  if (SUPPORT.buyMeACoffee)
    links.push({
      key: 'coffee',
      href: `https://buymeacoffee.com/${SUPPORT.buyMeACoffee}`,
      label: t(locale, 'support.coffee'),
      Icon: Coffee,
    })
  if (SUPPORT.toss)
    links.push({ key: 'toss', href: SUPPORT.toss, label: t(locale, 'support.toss'), Icon: Wallet })

  return (
    <div className="flex flex-col gap-2 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {t(locale, 'support.title')}
      </p>
      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {t(locale, 'support.body')}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {links.map(({ key, href, label, Icon }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('support-click', { via: key, locale })}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
            style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </a>
        ))}
      </div>
    </div>
  )
}
