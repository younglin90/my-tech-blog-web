'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { localePathPrefix, t } from '@/lib/i18n'
import { trackEvent } from '@/lib/analytics'
import { getPostStats, sendVote } from '@/lib/post-stats'

const STORAGE_KEY = 'cfd-lab-post-feedback'

interface Stored {
  vote: 'up' | 'down'
  reason?: string
  ts: number
}
type Store = Record<string, Stored>

function load(): Store {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Store) : {}
  } catch {
    return {}
  }
}
function save(store: Store) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(store)) } catch {}
}

const POSITIVE_REASONS = ['feedback.r.clear', 'feedback.r.useful', 'feedback.r.code', 'feedback.r.viz']
const NEGATIVE_REASONS = ['feedback.r.unclear', 'feedback.r.tooHard', 'feedback.r.errors', 'feedback.r.shallow']

// 포스트 끝부분에 마운트. 👍/👎 → 선택 후 짧은 사유 chip 표시 →
// 한 번 투표하면 thank-you 메시지 + localStorage에 저장(중복 투표 방지).
// Umami custom event 'post-feedback' 발사 (slug, vote, reason).
// 표는 /api/feedback 으로 서버(D1)에도 보내고, 누적 👍/👎 수를 함께 보여준다.
export function PostFeedback({ postId }: { postId: string }) {
  const pathname = usePathname() ?? '/'
  const { locale } = localePathPrefix(pathname)
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  const [submitted, setSubmitted] = useState<Stored | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [counts, setCounts] = useState<{ up: number; down: number } | null>(null)

  useEffect(() => {
    setHydrated(true)
    const existing = load()[postId]
    if (existing) setSubmitted(existing)
    let cancelled = false
    getPostStats(postId).then((s) => { if (!cancelled && s) setCounts({ up: s.up, down: s.down }) })
    return () => { cancelled = true }
  }, [postId])

  const submit = (v: 'up' | 'down', reason?: string) => {
    const entry: Stored = { vote: v, reason, ts: Date.now() }
    const store = load()
    store[postId] = entry
    save(store)
    setSubmitted(entry)
    trackEvent('post-feedback', { slug: postId, vote: v, reason: reason ?? '' })
    sendVote(postId, v, reason).then((c) => { if (c) setCounts(c) })
  }

  if (!hydrated) return null

  const reasons = vote === 'up' ? POSITIVE_REASONS : vote === 'down' ? NEGATIVE_REASONS : null
  const headerColor = submitted?.vote === 'down' ? 'var(--text-muted)' : 'var(--accent)'

  return (
    <div
      className="mt-10 rounded-xl p-5"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div
        className="text-[10px] font-semibold uppercase tracking-widest"
        style={{ color: 'var(--text-faint)' }}
      >
        {t(locale, 'feedback.label')}
        {counts && counts.up + counts.down > 0 && (
          <span className="mono tabular ml-2 normal-case tracking-normal">
            · 👍 {counts.up} · 👎 {counts.down}
          </span>
        )}
      </div>

      {submitted ? (
        <div className="mt-2">
          <div className="text-sm font-medium" style={{ color: headerColor }}>
            {submitted.vote === 'up'
              ? t(locale, 'feedback.thanksUp')
              : t(locale, 'feedback.thanksDown')}
          </div>
          {submitted.reason && (
            <div className="mt-1 text-xs" style={{ color: 'var(--text-faint)' }}>
              · {t(locale, submitted.reason)}
            </div>
          )}
        </div>
      ) : vote === null ? (
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setVote('up')}
            className="min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            👍 {t(locale, 'feedback.up')}
          </button>
          <button
            type="button"
            onClick={() => setVote('down')}
            className="min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:opacity-90"
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
            }}
          >
            👎 {t(locale, 'feedback.down')}
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <div className="mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {t(locale, vote === 'up' ? 'feedback.askWhyUp' : 'feedback.askWhyDown')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {reasons?.map((rk) => (
              <button
                key={rk}
                type="button"
                onClick={() => submit(vote, rk)}
                className="mono inline-flex min-h-11 items-center rounded-full px-2.5 py-1 text-[11px] transition-colors hover:[border-color:var(--accent)] hover:[color:var(--accent)]"
                style={{
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
              >
                {t(locale, rk)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => submit(vote)}
              className="mono inline-flex min-h-11 items-center rounded-full px-2.5 py-1 text-[11px]"
              style={{ color: 'var(--text-faint)', textDecoration: 'underline' }}
            >
              {t(locale, 'feedback.skip')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
