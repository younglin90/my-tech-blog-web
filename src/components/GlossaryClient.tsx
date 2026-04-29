'use client'

import Link from 'next/link'
import { useMemo, useState, useCallback } from 'react'
import { t, type Locale } from '@/lib/i18n'

interface Entry {
  ko: string
  en: string
  wiki?: string
  count?: number
  source?: string
  posts?: Array<{
    slug: string
    title: string
    date: string
    count: number
  }>
}

interface Props {
  entries: [string, Entry][]
  locale: Locale
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

// 정의 텍스트에서 다른 glossary term을 찾아 자동 cross-link.
// query 검색 모드일 땐 highlight가 우선이라 cross-link 비활성.
function CrossLink({
  text,
  terms,
  exclude,
}: {
  text: string
  terms: string[]
  exclude: string
}) {
  // 길이 내림차순으로 정렬해 긴 term 우선 매칭 (예: "Reynolds Number"가 "Reynolds"보다 먼저).
  // exclude(현재 entry 자기 자신)는 제외.
  const candidates = terms
    .filter((t) => t !== exclude && t.length >= 2)
    .sort((a, b) => b.length - a.length)
  if (candidates.length === 0) return <>{text}</>
  const escaped = candidates.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  // 한글/영문 모두 보호하기 위해 Unicode-aware lookbehind/ahead 대신 단순 word boundary는 안 됨 (한글에서 동작 X).
  // 그래서 split으로 잘라서 매칭 토큰 자체가 capture되도록 함.
  // 단, 매칭 직전·직후가 영문자면 false-positive 가능 (예: "Re" → "Reactor"의 "Re" 매칭).
  // → 영문 term은 정확히 토큰 양쪽이 word boundary일 때만 매칭하도록 split 후 검증.
  const re = new RegExp(`(${escaped})`, 'g')
  const parts = text.split(re)
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 0) return p
        // 매칭된 term 양쪽이 영숫자에 둘러싸였으면 false-positive로 간주
        const before = i > 0 ? parts[i - 1].slice(-1) : ''
        const after = i + 1 < parts.length ? parts[i + 1].charAt(0) : ''
        const isAlphaNum = (c: string) => /[A-Za-z0-9]/.test(c)
        const isEnglishTerm = /^[A-Za-z]/.test(p)
        if (isEnglishTerm && (isAlphaNum(before) || isAlphaNum(after))) return p
        return (
          <a
            key={i}
            href={`#${p.toLowerCase()}`}
            className="border-b border-dotted"
            style={{ color: 'var(--accent)', borderColor: 'var(--accent)', borderBottomStyle: 'dotted' }}
          >
            {p}
          </a>
        )
      })}
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

function FlashcardMode({ entries, locale }: { entries: [string, Entry][]; locale: Locale }) {
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
          {t(locale, 'glossary.restart')}
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
          <p className="mt-6 text-xs" style={{ color: 'var(--text-faint)' }}>{t(locale, 'glossary.tapReveal')}</p>
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
          {t(locale, 'glossary.missed')}
        </button>
        <button
          onClick={() => next(true)}
          disabled={!revealed}
          className="rounded-lg px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-30"
          style={{ background: 'var(--surface)', border: '1px solid #34d399', color: '#34d399' }}
        >
          {t(locale, 'glossary.knew')}
        </button>
      </div>
      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{t(locale, 'glossary.flashcardHint')}</p>
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
      const postText = (def.posts ?? []).map((post) => post.title).join(' ')
      return [term, def_text, postText].join(' ').toLowerCase().includes(lower)
    })
  }, [q, entries, locale])

  // A-Z letter jump navigation
  const letters = useMemo(() => {
    const set = new Set<string>()
    entries.forEach(([t]) => { const l = t[0]?.toUpperCase(); if (l) set.add(l) })
    return [...set].sort()
  }, [entries])

  // 모든 term 이름 (cross-link용)
  const allTermNames = useMemo(() => entries.map(([term]) => term), [entries])

  if (mode === 'flashcard') {
    return (
      <>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>
            {t(locale, 'glossary.flashcards')} — {entries.length}
          </h2>
          <button
            onClick={() => setMode('browse')}
            className="rounded-md px-3 py-1.5 text-xs transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            {t(locale, 'glossary.backToBrowse')}
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
            placeholder={t(locale, 'glossary.filterPlaceholder')}
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
            title={t(locale, 'glossary.flashcardTitle')}
          >
            {t(locale, 'glossary.flashcards')}
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
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t(locale, 'glossary.noMatch', { query: q })}</p>
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
                  {typeof def.count === 'number' && def.count > 0 && (
                    <span className="mono rounded px-1.5 py-0.5 text-[10px]" style={{ background: 'var(--bg)', color: 'var(--text-faint)' }}>
                      {def.count} hits
                    </span>
                  )}
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
                  {q ? (
                    <Highlight text={definition} query={q} />
                  ) : (
                    <CrossLink text={definition} terms={allTermNames} exclude={term} />
                  )}
                </dd>
                {def.posts && def.posts.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
                      {t(locale, 'glossary.sourcePosts')}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {def.posts.slice(0, 5).map((post) => (
                        <Link
                          key={`${term}-${post.slug}`}
                          href={`/${locale}/posts/${post.slug}`}
                          className="rounded-lg px-2.5 py-1.5 text-xs transition-colors"
                          style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
                        >
                          <span className="link-hover-accent">{post.title}</span>
                          <span className="mono ml-1" style={{ color: 'var(--text-faint)' }}>
                            ×{post.count}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </dl>
    </>
  )
}
