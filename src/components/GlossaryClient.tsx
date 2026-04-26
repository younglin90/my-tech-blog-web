'use client'

import { useMemo, useState } from 'react'

interface Entry {
  ko: string
  en: string
  wiki?: string
}

interface Props {
  entries: [string, Entry][]
  locale: string
  total: number
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'))
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} style={{ background: 'var(--accent-glow)', color: 'var(--accent)', borderRadius: '0.2em', padding: '0 0.1em' }}>
            {p}
          </mark>
        ) : (
          p
        )
      )}
    </>
  )
}

export function GlossaryClient({ entries, locale, total }: Props) {
  const [q, setQ] = useState('')
  const filtered = useMemo(() => {
    const lower = q.trim().toLowerCase()
    if (!lower) return entries
    return entries.filter(([term, def]) => {
      const def_text = (locale === 'ko' ? def.ko : def.en) || def.en || def.ko
      return term.toLowerCase().includes(lower) || def_text.toLowerCase().includes(lower)
    })
  }, [q, entries, locale])

  // A-Z letter jump navigation
  const letters = useMemo(() => {
    const set = new Set<string>()
    entries.forEach(([t]) => { const l = t[0]?.toUpperCase(); if (l) set.add(l) })
    return [...set].sort()
  }, [entries])

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            placeholder="Filter terms…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full rounded-lg px-4 py-2 text-sm focus:outline-none"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: 'var(--text-faint)' }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <span className="mono text-xs" style={{ color: 'var(--text-faint)' }}>
          {filtered.length} / {total} terms
        </span>
      </div>

      {!q && (
        <div className="mb-5 flex flex-wrap gap-1">
          {letters.map((l) => (
            <a
              key={l}
              href={`#letter-${l}`}
              className="mono rounded px-2 py-0.5 text-xs transition-colors hover:bg-[var(--surface)]"
              style={{ color: 'var(--accent)' }}
            >
              {l}
            </a>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No terms match "{q}".</p>
      )}

      <dl className="space-y-5">
        {filtered.map(([term, def], idx) => {
          const definition = (locale === 'ko' ? def.ko : def.en) || def.en || def.ko
          const letter = term[0]?.toUpperCase()
          const prevLetter = idx > 0 ? filtered[idx - 1][0][0]?.toUpperCase() : null
          const showAnchor = !q && letter !== prevLetter

          return (
            <div key={term}>
              {showAnchor && (
                <div
                  id={`letter-${letter}`}
                  className="mono mb-2 text-xs font-bold scroll-mt-20"
                  style={{ color: 'var(--text-faint)', letterSpacing: '0.1em' }}
                >
                  — {letter} —
                </div>
              )}
              <div
                id={term.toLowerCase()}
                className="rounded-lg p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <dt className="flex items-baseline gap-3">
                  <span className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
                    <Highlight text={term} query={q} />
                  </span>
                  {def.wiki && (
                    <a
                      href={def.wiki}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono text-[10px] underline underline-offset-2"
                      style={{ color: 'var(--text-faint)' }}
                    >
                      wiki ↗
                    </a>
                  )}
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  <Highlight text={definition} query={q} />
                </dd>
              </div>
            </div>
          )
        })}
      </dl>
    </>
  )
}
