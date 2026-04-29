'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sun, Moon } from 'lucide-react'
import { localePathPrefix, t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    return <div className="h-11 w-11" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => {
        const next = isDark ? 'light' : 'dark'
        setTheme(next)
        trackEvent('theme-toggle', { to: next })
      }}
      className="theme-toggle flex min-h-11 min-w-11 items-center justify-center rounded-md p-1.5 transition-colors duration-100"
      style={{ color: 'var(--text-muted)' }}
      aria-label={t(locale, 'theme.toggle')}
      title={`${t(locale, 'theme.toggle')} (T)`}
    >
      {isDark ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  )
}
