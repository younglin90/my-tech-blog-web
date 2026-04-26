'use client'

import { useMemo, useState, useCallback } from 'react'

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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function FlashcardMode({ entries, locale }: { entries: [string, Entry][]; locale: string }) {
  const [deck, setDeck] = useState(() => shuffle(entries))
  const [idx, setIdx] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [incorrect, setIncorrect] = useState(0)
  const done = idx >= deck.length

  const next = useCallback((known: boolean) => {
    if (known) setCorrect((c) => c + 1); else setIncorrect((c) => c + 1)
    setRevealed(false)
    setIdx((i) => i + 1)
  }, [])

  const restart = useCallback(() => {
    setDeck(shuffle(entries))
    setIdx(0)
    setRevealed(false)
    setCorrect(0)
    setIncorrect(0)
  }, [entries])

  if (done) {
    const total = correct + incorrect
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0
    return (
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <div className="text-5xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
          {pct}%
        </div>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {correct} correct · {incorrect} missed · {total} total
        </p>
        <div className="w-full max-w-xs rounded-full h-2" style={{ background: 'var(--border)' }}>
          <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
        </div>
        <button
          onClick={restart}
          className="rounded-lg px-6 py-2.5 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ background: 'var(--accent)', color: '#08111f' }}
        >
          Restart
        </button>
      </div>
    )
  }

  const [term, def] = deck[idx]
  const definition = (locale === 'ko' ? def.ko : def.en) || def.en || def.ko

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex w-full items-center justify-between text-xs" style={{ color: 'var(--text-faint)' }}>
        <span className="mono">{idx + 1} / {deck.length}</span>
        <span>✓ {correct} &nbsp; ✗ {incorrect}</span>
      </div>

      <div
        className="relative w-full max-w-lg cursor-pointer select-none rounded-2xl p-10 text-center transition-all duration-150"
        style={{ background: 'var(--surface)', border: '2px solid var(--border)', minHeight: 220 }}
        onClick={() => setRevealed((r) => !r)}
      >
        <div className="text-xl font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)', fontSize: 28 }}>
          {term}
        </div>
        {revealed ? (
          <p className="mt-6 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            {definition}
          </p>
        ) : (
          <p className="mt-6 text-xs" style={{ color: 'var(--text-faint)' }}>tap to reveal</p>
        )}
        {def.wiki && revealed && (
          <a
            href={def.wiki}
            target="_blank"
            rel="noopener noreferrer"
            className="mono mt-4 inline-block text-[10px] underline"
            style={{ color: 'var(--text-faint)' }}
            onClick={(e) => e.stopPropagation()}
          >
            wiki ↗
          </a>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => next(false)}
          disabled={!revealed}
          className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-30"
          style={{ background: 'var(--surface)', border: '1px solid #f87171', color: '#f87171' }}
        >
          ✗ missed
        </button>
        <button
          onClick={() => next(true)}
          disabled={!revealed}
          className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-30"
          style={{ background: 'var(--surface)', border: '1px solid #34d399', color: '#34d399' }}
        >
          ✓ knew it
        </button>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>click the card to reveal · then mark yourself</p>
    </div>
  )
}

export function GlossaryClient({ entries, locale, total }: Props) {
  const [q, setQ] = useState('')
  const [mode, setMode] = useState<'browse' | 'flashcard'>('browse')
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

  if (mode === 'flashcard') {
    return (
      <>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            Flashcard mode — {entries.length} terms
          </h2>
          <button
            onClick={() => setMode('browse')}
            className="rounded-md px-3 py-1.5 text-xs transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            ← back to browse
          </button>
        </div>
        <FlashcardMode entries={entries} locale={locale} />
      </>
    )
  }

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
        <div className="flex items-center gap-2">
          <span className="mono text-xs" style={{ color: 'var(--text-faint)' }}>
            {filtered.length} / {total}
          </span>
          <button
            onClick={() => setMode('flashcard')}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ background: 'var(--accent-glow)', border: '1px solid var(--accent)', color: 'var(--accent)' }}
            title="Quiz yourself on CFD terms"
          >
            ⚡ Flashcards
          </button>
        </div>
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
