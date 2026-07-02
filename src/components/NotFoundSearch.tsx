'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DEFAULT_LOCALE, t, type Locale } from '@/lib/i18n'

export function NotFoundSearch({ locale = DEFAULT_LOCALE }: { locale?: Locale }) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    router.push(`/${locale}/?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex w-full max-w-sm gap-2">
      <div className="relative flex-1">
        <Search
          className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
          style={{ color: 'var(--text-faint)' }}
        />
        <input
          type="search"
          placeholder={t(locale, 'notFound.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
          }}
        />
      </div>
      <button
        type="submit"
        className="rounded-md px-4 py-2 text-sm font-medium transition-opacity hover:opacity-75"
        style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
      >
        {t(locale, 'notFound.searchButton')}
      </button>
    </form>
  )
}
